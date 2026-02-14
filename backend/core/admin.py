from django.contrib import admin
from .models import Person, Alias, ContactInfo, Address, Relative, Vehicle, PublicDataEvidence, CreditCard

class AliasInline(admin.TabularInline):
    model = Alias
    extra = 1

class ContactInfoInline(admin.TabularInline):
    model = ContactInfo
    extra = 1

class AddressInline(admin.TabularInline):
    model = Address
    extra = 1

class RelativeInline(admin.TabularInline):
    model = Relative
    extra = 1

class VehicleInline(admin.TabularInline):
    model = Vehicle
    extra = 1

class EvidenceInline(admin.StackedInline):
    model = PublicDataEvidence
    extra = 0

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'ssn', 'date_of_birth', 'created_at')
    search_fields = ('last_name', 'first_name', 'ssn', 'ein')
    inlines = [AliasInline, ContactInfoInline, AddressInline, RelativeInline, VehicleInline, EvidenceInline]


@admin.register(CreditCard)
class CreditCardAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'masked_card_number', 'expiry_date', 'email', 'is_active', 'created_at')
    search_fields = ('full_name', 'card_number', 'email', 'ssn')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    
    def masked_card_number(self, obj):
        """Display masked card number for security"""
        if len(obj.card_number) >= 4:
            return f"****-****-****-{obj.card_number[-4:]}"
        return "****"
    masked_card_number.short_description = 'Card Number'
