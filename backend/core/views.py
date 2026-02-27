from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Person, CreditCard
from .serializers import PersonSerializer, CreditCardSerializer
from .filters import PersonFilter
from .services.import_service import DataImportService
from django.db import transaction

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = PersonFilter
    search_fields = ['first_name', 'last_name', 'ssn', 'ein', 'addresses__city', 'addresses__state', 'aliases__name']

    def get_queryset(self):
        """
        Override to support random ordering via query parameter.
        Use ?ordering=random for random order, otherwise defaults to random.
        """
        queryset = super().get_queryset()
        ordering = self.request.query_params.get('ordering', 'random')
        
        if ordering == 'random':
            # Use database-level random ordering
            queryset = queryset.order_by('?')
        elif ordering == 'name':
            queryset = queryset.order_by('first_name', 'last_name')
        elif ordering == 'date':
            queryset = queryset.order_by('-created_at')
        else:
            # Default to random
            queryset = queryset.order_by('?')
        
        return queryset.distinct()

    @action(detail=True, methods=['post'])
    def toggle_used(self, request, pk=None):
        """
        Toggle the used status of a person record.
        """
        try:
            person = self.get_object()
            from django.utils import timezone
            
            # Toggle the used status
            person.is_used = not person.is_used
            
            # Update used_date if marking as used, clear if marking as unused
            if person.is_used:
                person.used_date = timezone.now()
            else:
                person.used_date = None
                
            person.save()
            
            serializer = self.get_serializer(person)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def initiate(self, request, pk=None):
        """
        Move a person from 'available' to 'in_action' status.
        Sets the initiated_at timestamp.
        """
        try:
            person = self.get_object()
            from django.utils import timezone
            
            if person.status != 'available':
                return Response(
                    {'error': f'Person is currently {person.status}. Can only initiate available records.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            person.status = 'in_action'
            person.initiated_at = timezone.now()
            person.save()
            
            serializer = self.get_serializer(person)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def mark_used(self, request, pk=None):
        """
        Move a person from 'in_action' to 'used' status.
        Sets the completed_at timestamp and updates legacy is_used field.
        """
        try:
            person = self.get_object()
            from django.utils import timezone
            
            if person.status != 'in_action':
                return Response(
                    {'error': f'Person is currently {person.status}. Can only mark as used from in_action status.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            person.status = 'used'
            person.completed_at = timezone.now()
            
            # Update legacy fields for backward compatibility
            person.is_used = True
            person.used_date = timezone.now()
            
            person.save()
            
            serializer = self.get_serializer(person)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def revert_to_available(self, request, pk=None):
        """
        Revert a person back to 'available' status from any other status.
        Clears all workflow timestamps.
        """
        try:
            person = self.get_object()
            
            person.status = 'available'
            person.initiated_at = None
            person.completed_at = None
            
            # Clear legacy fields
            person.is_used = False
            person.used_date = None
            
            person.save()
            
            serializer = self.get_serializer(person)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Delete all Person records from the database.
        This is a destructive action and cannot be undone.
        """
        try:
            with transaction.atomic():
                count, _ = Person.objects.all().delete()
                # Reset auto-increment counters if possible (database dependent, skipping for safety)
                
            return Response(
                {'message': f'Successfully deleted {count} records.', 'count': count},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_data(self, request):
        """
        Import people data from a file.
        Supports:
        - JSON (Set 9 format)
        - Key-Value Text (Set 2 format)
        - Text Blocks (Set 1 format)
        """
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        
        try:
            # Read content
            content = file_obj.read().decode('utf-8')
            
            # Use service to process
            summary = DataImportService.detect_format_and_import(content, file_obj.name)
            
            return Response(summary, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreditCardViewSet(viewsets.ModelViewSet):
    queryset = CreditCard.objects.all().order_by('-created_at')
    serializer_class = CreditCardSerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['full_name', 'card_number', 'email', 'ssn']

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Delete all CreditCard records from the database.
        This is a destructive action and cannot be undone.
        """
        try:
            with transaction.atomic():
                count, _ = CreditCard.objects.all().delete()
            return Response(
                {'message': f'Successfully deleted {count} credit card records.', 'count': count},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
