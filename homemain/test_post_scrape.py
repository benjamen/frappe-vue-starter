# homemain/test_post_scrape.py

import frappe
from homemain.post_scrape import apply_if_ready

def test_barberry_grove_processing():
    """
    Test processing for your 2 Barberry Grove property
    """

    # Find your property (replace with actual name)
    property_name = "2 Barberry Grove Property"  # Update this to match your actual property name

    try:
        property_doc = frappe.get_doc("Property", property_name)
        print(f"Found property: {property_doc.name}")
        print(f"Address: {property_doc.address}")
        print(f"Homes Estimate: {property_doc.homes_estimate_value}")
        print(f"Estimate Date: {property_doc.homes_estimate_date}")

        # Run post-scrape processing
        created_records = apply_if_ready(property_doc)

        if created_records:
            print("\n✅ Successfully created records:")
            for record in created_records:
                print(f"  - {record}")
        else:
            print("\n⚠️ No new records created (may already exist)")

        # Show what was created
        estimates = frappe.get_all("Property Estimate",
            filters={"property": property_name},
            fields=["name", "estimate_date", "estimate_value", "estimate_value_display", "change_direction"],
            order_by="creation desc"
        )

        print(f"\n📊 Property Estimates for {property_name}:")
        for est in estimates:
            print(f"  {est.estimate_date}: {est.estimate_value_display} ({est.change_direction}) - {est.name}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def test_all_properties_processing():
    """
    Process all properties that have scraping data
    """

    properties = frappe.get_all("Property",
        filters={"scraper_status": "Success"},
        fields=["name", "title", "homes_estimate_value"]
    )

    print(f"Found {len(properties)} properties with successful scraping")

    for prop in properties:
        print(f"\n--- Processing {prop.title} ---")
        try:
            property_doc = frappe.get_doc("Property", prop.name)
            created_records = apply_if_ready(property_doc)

            if created_records:
                print(f"✅ Created: {', '.join(created_records)}")
            else:
                print("⚠️ No new records created")

        except Exception as e:
            print(f"❌ Error processing {prop.title}: {e}")

# Run this in Frappe console:
if __name__ == "__main__":
    # Test specific property
    test_barberry_grove_processing()

    # Or test all properties
    # test_all_properties_processing()
