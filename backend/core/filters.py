import django_filters
from .models import Person
from datetime import date

class PersonFilter(django_filters.FilterSet):
    min_age = django_filters.NumberFilter(method='filter_min_age')
    max_age = django_filters.NumberFilter(method='filter_max_age')
    sex = django_filters.CharFilter(lookup_expr='iexact')
    state = django_filters.CharFilter(field_name='addresses__state', lookup_expr='icontains')
    status = django_filters.CharFilter(lookup_expr='iexact')
    city = django_filters.CharFilter(field_name='addresses__city', lookup_expr='icontains')
    ssn = django_filters.CharFilter(lookup_expr='icontains')
    ein = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Person
        fields = ['sex', 'state', 'city', 'min_age', 'max_age', 'status', 'ssn', 'ein']

    def filter_min_age(self, queryset, name, value):
        """Filter for minimum age - person must be at least this old"""
        try:
            today = date.today()
            limit_date = today.replace(year=today.year - int(value))
            return queryset.filter(date_of_birth__lte=limit_date)
        except (ValueError, TypeError):
            return queryset

    def filter_max_age(self, queryset, name, value):
        """Filter for maximum age - person must be at most this old"""
        try:
            today = date.today()
            limit_date = today.replace(year=today.year - int(value) - 1)
            return queryset.filter(date_of_birth__gt=limit_date)
        except (ValueError, TypeError):
            return queryset
