# homemain/post_scrape.py

import frappe
import hashlib
import json
from datetime import datetime
from frappe.utils import flt, cstr, getdate, nowdate

def apply_if_ready(property_doc):
    """
    Process scraped property data and create related DocType records
    """
    logger = frappe.logger("homemain")

    try:
        # Generate a key for this data state to prevent duplicate processing
        data_key = generate_data_key(property_doc)

        # Check if we've already processed this exact data
        if property_doc.get("scrape_applied_key") == data_key:
            logger.info(f"[PostScrape] Data already processed for {property_doc.name}")
            return

        # Process different types of scraped data
        created_records = []

        # 1. Create Property Estimate from Homes.co.nz data
        if has_homes_estimate_data(property_doc):
            estimate_doc = create_property_estimate(property_doc)
            if estimate_doc:
                created_records.append(f"Property Estimate: {estimate_doc.name}")

        # 2. Create Valuation Record from council data (if available)
        if has_council_valuation_data(property_doc):
            valuation_doc = create_valuation_record(property_doc)
            if valuation_doc:
                created_records.append(f"Valuation Record: {valuation_doc.name}")

        # 3. Create Rate Record from council rates data (if available)
        if has_rates_data(property_doc):
            rate_doc = create_rate_record(property_doc)
            if rate_doc:
                created_records.append(f"Rate Record: {rate_doc.name}")

        # 4. Geocode address if coordinates are missing
        if needs_geocoding(property_doc):
            geocode_property(property_doc)

        # Mark as processed
        property_doc.db_set("scrape_applied_key", data_key, update_modified=False)
        property_doc.db_set("scrape_applied_at", frappe.utils.now(), update_modified=False)

        if created_records:
            logger.info(f"[PostScrape] Created records for {property_doc.name}: {', '.join(created_records)}")

        return created_records

    except Exception as e:
        logger.error(f"[PostScrape] Failed for {property_doc.name}: {e}")
        raise

def generate_data_key(property_doc):
    """Generate hash key of relevant scraped data to detect changes"""
    key_data = {
        'homes_estimate_value': property_doc.get('homes_estimate_value'),
        'homes_estimate_date': property_doc.get('homes_estimate_date'),
        'homes_estimate_range_min': property_doc.get('homes_estimate_range_min'),
        'homes_estimate_range_max': property_doc.get('homes_estimate_range_max'),
        'capital_value': property_doc.get('capital_value'),
        'land_value': property_doc.get('land_value'),
        'total_rates': property_doc.get('total_rates'),
        'council_property_id': property_doc.get('council_property_id')
    }

    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()

def has_homes_estimate_data(property_doc):
    """Check if property has valid Homes.co.nz estimate data"""
    return (property_doc.get('homes_estimate_value') and
            property_doc.get('homes_estimate_value') != 'N/A' and
            property_doc.get('homes_estimate_date'))

def create_property_estimate(property_doc):
    """Create Property Estimate record from scraped data"""
    try:
        # Parse estimate value (remove K, convert to number)
        estimate_display = property_doc.get('homes_estimate_value', '').strip()
        estimate_value = parse_currency_value(estimate_display)

        if not estimate_value:
            return None

        # Parse range values
        range_min = parse_currency_value(property_doc.get('homes_estimate_range_min', ''))
        range_max = parse_currency_value(property_doc.get('homes_estimate_range_max', ''))

        # Parse date
        estimate_date = parse_estimate_date(property_doc.get('homes_estimate_date', ''))

        # Check if we already have an estimate for this date and value
        existing = frappe.db.exists("Property Estimate", {
            "property": property_doc.name,
            "estimate_date": estimate_date,
            "estimate_value": estimate_value,
            "source": "Homes.co.nz"
        })

        if existing:
            frappe.logger().info(f"[PostScrape] Property Estimate already exists: {existing}")
            return frappe.get_doc("Property Estimate", existing)

        # Get previous estimate for change calculation
        previous_estimate = get_previous_estimate(property_doc.name, estimate_date)

        estimate_doc = frappe.new_doc("Property Estimate")
        estimate_doc.update({
            "title": f"{property_doc.title} - {estimate_display} ({estimate_date})",
            "property": property_doc.name,
            "estimate_date": estimate_date,
            "source": "Homes.co.nz",
            "estimate_value": estimate_value,
            "estimate_value_display": estimate_display,
            "range_min": range_min,
            "range_max": range_max,
            "confidence_level": "Medium",  # Default for Homes.co.nz
            "suburb_name": property_doc.get('homes_estimate_suburb', 'N/A'),
            "raw_data": json.dumps({
                "homes_estimate_value": property_doc.get('homes_estimate_value'),
                "homes_estimate_date": property_doc.get('homes_estimate_date'),
                "homes_estimate_range_min": property_doc.get('homes_estimate_range_min'),
                "homes_estimate_range_max": property_doc.get('homes_estimate_range_max'),
                "homes_estimate_suburb": property_doc.get('homes_estimate_suburb'),
                "homes_estimate_suburb_value": property_doc.get('homes_estimate_suburb_value')
            })
        })

        # Calculate change from previous estimate
        if previous_estimate:
            estimate_doc.previous_estimate = previous_estimate.estimate_value
            estimate_doc.value_change = estimate_value - previous_estimate.estimate_value
            if previous_estimate.estimate_value > 0:
                estimate_doc.change_percentage = (estimate_doc.value_change / previous_estimate.estimate_value) * 100

            if estimate_doc.value_change > 0:
                estimate_doc.change_direction = "Increase"
            elif estimate_doc.value_change < 0:
                estimate_doc.change_direction = "Decrease"
            else:
                estimate_doc.change_direction = "No Change"
        else:
            estimate_doc.change_direction = "First Estimate"

        # Set market position based on suburb average
        suburb_avg = parse_currency_value(property_doc.get('homes_estimate_suburb_value', ''))
        if suburb_avg and estimate_value:
            if estimate_value > suburb_avg * 1.1:
                estimate_doc.market_position = "Above Average"
                estimate_doc.suburb_average = suburb_avg
            elif estimate_value < suburb_avg * 0.9:
                estimate_doc.market_position = "Below Average"
                estimate_doc.suburb_average = suburb_avg
            else:
                estimate_doc.market_position = "Average"
                estimate_doc.suburb_average = suburb_avg

        estimate_doc.insert()
        frappe.logger().info(f"[PostScrape] Created Property Estimate: {estimate_doc.name}")
        return estimate_doc

    except Exception as e:
        frappe.logger().error(f"[PostScrape] Failed to create Property Estimate: {e}")
        return None

def parse_currency_value(value_str):
    """Parse currency string like '$840K' or '$785,000' to float"""
    if not value_str or value_str in ['N/A', '0', '']:
        return 0.0

    # Remove currency symbols and spaces
    clean_str = str(value_str).replace('$', '').replace(',', '').replace(' ', '').upper()

    try:
        # Handle K (thousands) suffix
        if clean_str.endswith('K'):
            return float(clean_str[:-1]) * 1000
        # Handle M (millions) suffix
        elif clean_str.endswith('M'):
            return float(clean_str[:-1]) * 1000000
        else:
            return float(clean_str)
    except (ValueError, TypeError):
        frappe.logger().warning(f"[PostScrape] Could not parse currency value: {value_str}")
        return 0.0

def parse_estimate_date(date_str):
    """Parse date string like '7 Aug 2025' to date"""
    if not date_str or date_str == 'N/A':
        return nowdate()

    try:
        # Try to parse common date formats
        if 'Aug' in date_str or 'Jan' in date_str or 'Feb' in date_str:
            # Handle format like "7 Aug 2025"
            from dateutil import parser
            return parser.parse(date_str).date()
        else:
            return getdate(date_str)
    except:
        frappe.logger().warning(f"[PostScrape] Could not parse date: {date_str}")
        return nowdate()

def get_previous_estimate(property_name, current_date):
    """Get the most recent estimate before current date"""
    return frappe.db.get_value("Property Estimate",
        {
            "property": property_name,
            "estimate_date": ["<", current_date]
        },
        ["name", "estimate_value", "estimate_date"],
        order_by="estimate_date desc"
    )

def has_council_valuation_data(property_doc):
    """Check if property has council valuation data"""
    return (property_doc.get('capital_value', 0) > 0 or
            property_doc.get('land_value', 0) > 0)

def create_valuation_record(property_doc):
    """Create Valuation Record from council data (placeholder for future)"""
    # TODO: Implement when Valuation Record DocType is created
    frappe.logger().info(f"[PostScrape] Valuation Record creation not yet implemented")
    return None

def has_rates_data(property_doc):
    """Check if property has rates data"""
    return property_doc.get('total_rates', 0) > 0

def create_rate_record(property_doc):
    """Create Rate Record from council data (placeholder for future)"""
    # TODO: Implement when Rate Record DocType is created
    frappe.logger().info(f"[PostScrape] Rate Record creation not yet implemented")
    return None

def needs_geocoding(property_doc):
    """Check if property needs geocoding"""
    return (property_doc.get('geo_lat', 0) == 0 and
            property_doc.get('geo_lng', 0) == 0 and
            property_doc.get('address'))

def geocode_property(property_doc):
    """Add geocoding for property address (placeholder for future)"""
    # TODO: Implement geocoding service
    frappe.logger().info(f"[PostScrape] Geocoding not yet implemented for {property_doc.name}")
    return None
