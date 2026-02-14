from django.db import models

class Person(models.Model):
    # Core Identity
    first_name = models.CharField(max_length=150)
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150)
    mother_maiden_name = models.CharField(max_length=150, blank=True, null=True)
    
    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    sex = models.CharField(max_length=1, choices=SEX_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    # Identification
    ssn = models.CharField(max_length=20, blank=True, null=True, verbose_name="Social Security Number")
    ssn_state_of_issuance = models.CharField(max_length=50, blank=True, null=True)
    ssn_issue_date_approx = models.DateField(blank=True, null=True, verbose_name="SSN Date of Issuance (Approx)")
    ein = models.CharField(max_length=50, blank=True, null=True, verbose_name="EIN")
    
    driver_license_number = models.CharField(max_length=50, blank=True, null=True)
    driver_license_issue_date = models.DateField(blank=True, null=True)
    driver_license_expiration = models.DateField(blank=True, null=True)

    # Financial
    credit_score = models.IntegerField(blank=True, null=True)

    # Status and Workflow
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in_action', 'In Action'),
        ('used', 'Used'),
    ]
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='available',
        help_text="Current workflow status"
    )
    initiated_at = models.DateTimeField(
        blank=True, 
        null=True, 
        help_text="When status changed to in_action"
    )
    completed_at = models.DateTimeField(
        blank=True, 
        null=True, 
        help_text="When status changed to used"
    )

    # Research Data
    research_notes = models.TextField(
        blank=True, 
        null=True, 
        help_text="Additional notes and information from research"
    )
    
    # Legacy fields (kept for backward compatibility)
    is_used = models.BooleanField(default=False, help_text="Mark as used/unused")
    used_date = models.DateTimeField(blank=True, null=True, help_text="When this record was marked as used")

    # Meta
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Alias(models.Model):
    person = models.ForeignKey(Person, related_name='aliases', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class ContactInfo(models.Model):
    """Stores Phones and Emails generically or specifically"""
    CONTACT_TYPES = [
        ('PHONE', 'Phone'),
        ('EMAIL', 'Email'),
    ]
    person = models.ForeignKey(Person, related_name='contacts', on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=CONTACT_TYPES)
    value = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.type}: {self.value}"

class Address(models.Model):
    person = models.ForeignKey(Person, related_name='addresses', on_delete=models.CASCADE)
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='USA')
    
    is_current = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.street}, {self.city}"

class Relative(models.Model):
    person = models.ForeignKey(Person, related_name='relatives', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    relation = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Spouse, Brother")
    
    def __str__(self):
        return f"{self.name} ({self.relation})"

class Vehicle(models.Model):
    person = models.ForeignKey(Person, related_name='vehicles', on_delete=models.CASCADE)
    make = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    plate_number = models.CharField(max_length=50, blank=True, null=True)
    vin = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.year} {self.make} {self.model}"

class PublicDataEvidence(models.Model):
    person = models.ForeignKey(Person, related_name='evidence', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='evidence/', blank=True, null=True)
    external_link = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title

class CreditCard(models.Model):
    # Card Information
    card_number = models.CharField(max_length=19, help_text="Credit card number")
    expiry_date = models.CharField(max_length=7, help_text="MM/YYYY format")
    cvv = models.CharField(max_length=4, help_text="CVV/CVC code")
    
    # Cardholder Information
    full_name = models.CharField(max_length=255, help_text="Full name on card")
    address = models.TextField(help_text="Billing address")
    email = models.EmailField(help_text="Email address")
    ssn = models.CharField(max_length=20, help_text="Social Security Number")
    
    # Status and Meta
    is_active = models.BooleanField(default=True, help_text="Is card active/valid")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        # Mask card number for security
        masked_number = f"****-****-****-{self.card_number[-4:]}" if len(self.card_number) >= 4 else "****"
        return f"{self.full_name} - {masked_number}"
