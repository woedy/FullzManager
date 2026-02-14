from rest_framework import serializers
from .models import Person, Alias, ContactInfo, Address, Relative, Vehicle, PublicDataEvidence, CreditCard

class AliasSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Alias
        fields = ['id', 'name']

class ContactInfoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = ContactInfo
        fields = ['id', 'type', 'value']

class AddressSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'zip_code', 'country', 'is_current']

class RelativeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Relative
        fields = ['id', 'name', 'relation']

class VehicleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Vehicle
        fields = ['id', 'make', 'model', 'year', 'plate_number', 'vin']

class PublicDataEvidenceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = PublicDataEvidence
        fields = ['id', 'title', 'file', 'external_link', 'description']

class PersonSerializer(serializers.ModelSerializer):
    aliases = AliasSerializer(many=True, required=False)
    contacts = ContactInfoSerializer(many=True, required=False)
    addresses = AddressSerializer(many=True, required=False)
    relatives = RelativeSerializer(many=True, required=False)
    vehicles = VehicleSerializer(many=True, required=False)
    evidence = PublicDataEvidenceSerializer(many=True, required=False)

    class Meta:
        model = Person
        fields = '__all__'

    def create(self, validated_data):
        # Extract nested data
        aliases_data = validated_data.pop('aliases', [])
        contacts_data = validated_data.pop('contacts', [])
        addresses_data = validated_data.pop('addresses', [])
        relatives_data = validated_data.pop('relatives', [])
        vehicles_data = validated_data.pop('vehicles', [])
        evidence_data = validated_data.pop('evidence', [])

        # Create Person
        person = Person.objects.create(**validated_data)

        # Create nested objects
        for data in aliases_data:
            Alias.objects.create(person=person, **data)
        for data in contacts_data:
            ContactInfo.objects.create(person=person, **data)
        for data in addresses_data:
            Address.objects.create(person=person, **data)
        for data in relatives_data:
            Relative.objects.create(person=person, **data)
        for data in vehicles_data:
            Vehicle.objects.create(person=person, **data)
        for data in evidence_data:
            PublicDataEvidence.objects.create(person=person, **data)
            
        return person

    def update(self, instance, validated_data):
        # Update Person fields
        for attr, value in validated_data.items():
            if attr not in ['aliases', 'contacts', 'addresses', 'relatives', 'vehicles', 'evidence']:
                setattr(instance, attr, value)
        instance.save()

        # Helper to handle nested update/create/delete
        def update_nested(model, related_name, data):
            if data is None:
                return
            
            # Incoming IDs
            incoming_ids = [item.get('id') for item in data if item.get('id')]
            
            # Delete missing (optional, can be strict or loose. For now, strict: if not in list, delete)
            getattr(instance, related_name).exclude(id__in=incoming_ids).delete()
            
            for item in data:
                item_id = item.get('id')
                if item_id:
                    # Update existing
                    try:
                        obj = getattr(instance, related_name).get(id=item_id)
                        for k, v in item.items():
                            setattr(obj, k, v)
                        obj.save()
                    except model.DoesNotExist:
                        pass # Should not happen unless bad ID passed
                else:
                    # Create new
                    model.objects.create(person=instance, **item)

        # Update nested relationships
        update_nested(Alias, 'aliases', validated_data.get('aliases'))
        update_nested(ContactInfo, 'contacts', validated_data.get('contacts'))
        update_nested(Address, 'addresses', validated_data.get('addresses'))
        update_nested(Relative, 'relatives', validated_data.get('relatives'))
        update_nested(Vehicle, 'vehicles', validated_data.get('vehicles'))
        update_nested(PublicDataEvidence, 'evidence', validated_data.get('evidence'))

        return instance

class CreditCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditCard
        fields = '__all__'
        
    def validate_card_number(self, value):
        """Basic card number validation"""
        # Remove spaces and dashes
        cleaned = value.replace(' ', '').replace('-', '')
        if not cleaned.isdigit():
            raise serializers.ValidationError("Card number must contain only digits")
        if len(cleaned) < 13 or len(cleaned) > 19:
            raise serializers.ValidationError("Card number must be between 13 and 19 digits")
        return cleaned
    
    def validate_expiry_date(self, value):
        """Validate expiry date format MM/YYYY"""
        import re
        if not re.match(r'^\d{2}/\d{4}$', value):
            raise serializers.ValidationError("Expiry date must be in MM/YYYY format")
        return value
    
    def validate_cvv(self, value):
        """Validate CVV format"""
        if not value.isdigit():
            raise serializers.ValidationError("CVV must contain only digits")
        if len(value) < 3 or len(value) > 4:
            raise serializers.ValidationError("CVV must be 3 or 4 digits")
        return value
