# homemain/doctype/property_estimate/property_estimate_dashboard.py

def get_dashboard_data():
    return {
        'fieldname': 'property',
        'transactions': [
            {
                'label': 'Property Records',
                'items': ['Property']
            }
        ]
    }
