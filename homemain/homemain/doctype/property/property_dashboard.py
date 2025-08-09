# homemain/doctype/property/property_dashboard.py

def get_dashboard_data():
    return {
        'fieldname': 'property',
        'non_standard_fieldnames': {
            'Property Estimate': 'property_ref'  # if the field name is different
        },
        'transactions': [
            {
                'label': 'Market Data',
                'items': [
                    'Sale Record',
                    'Property Estimate'
                ]
            },
            {
                'label': 'Council Data',
                'items': [
                    'Valuation Record',
                    'Rate Record'
                ]
            }
        ],
        'reports': [
            {
                'label': 'Property Reports',
                'items': [
                    'Property Value History',
                    'Rate Analysis'
                ]
            }
        ]
    }
