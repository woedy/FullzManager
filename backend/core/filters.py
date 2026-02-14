import django_filters
from .models import Person
from datetime import date

class PersonFilter(django_filters.FilterSet):
    min_age = django_filters.NumberFilter(method='filter_min_age')
    max_age = django_filters.NumberFilter(method='filter_max_age')
    sex = django_filters.CharFilter(lookup_expr='iexact')
    state = django_filters.CharFilter(field_name='addresses__state', lookup_expr='icontains')
    status = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model = Person
        fields = ['sex', 'state', 'min_age', 'max_age', 'status']

    def filter_min_age(self, queryset, name, value):
        # min_age = 20 means born BEFORE or ON today-20 years.
        # Person born today is 0. 
        # Person born today-20years is 20.
        try:
            today = date.today()
            # If age is 20, DOB must be <= today.year - 20
            # Rough approximation using year replacement
            limit_date = today.replace(year=today.year - int(value))
            return queryset.filter(date_of_birth__lte=limit_date)
        except ValueError:
            return queryset

    def filter_max_age(self, queryset, name, value):
        # max_age = 30 means born AFTER or ON today-(30+1) years?
        # If age is 30, they are not 31 yet.
        # Person born today-31years is 31.
        # So DOB > today - (31) years.
        try:
            today = date.today()
            limit_date = today.replace(year=today.year - int(value) - 1)
            return queryset.filter(date_of_birth__gt=limit_date)
        except ValueError:
            return queryset
