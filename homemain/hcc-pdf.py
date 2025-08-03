import pdfplumber
import fitz  # PyMuPDF

import re

def extract_image_by_index(pdf_path, image_index=1, save_as="property_image.jpg"):
    """
    Extracts the Nth image from the PDF (image_index=0 for first, 1 for second, etc.)
    """
    doc = fitz.open(pdf_path)
    image_counter = 0
    for page_num in range(len(doc)):
        page = doc[page_num]
        img_list = page.get_images(full=True)
        for img in img_list:
            if image_counter == image_index:
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                ext = base_image["ext"]
                out_file = f"{save_as.rsplit('.',1)[0]}.{ext}"
                with open(out_file, "wb") as f:
                    f.write(image_bytes)
                print(f"Saved image #{image_index+1} as {out_file}")
                return out_file
            image_counter += 1
    print(f"No image at index {image_index} (found {image_counter} images total).")
    return None



def parse_rates_pdf_text(text):
    result = {}
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    def find_field(label, fallback_label=None):
        for i, line in enumerate(lines):
            if line.startswith(label):
                # Look for the next non-label, non-empty line
                for next_line in lines[i+1:]:
                    # Skip if this is another label
                    if fallback_label and next_line.startswith(fallback_label):
                        continue
                    # Skip if it's obviously a label or money field
                    if (next_line.endswith("Not Available") or
                        "$" in next_line or
                        next_line.endswith("Council")):
                        continue
                    return next_line
        return ""

    result['address'] = find_field("Property Address")
    result['legal_description'] = find_field("Legal Description")
    result['record_of_title'] = find_field("Record of Title")
    result['valuation_number'] = find_field("Valuation Number")
    result['property_area_sqm'] = find_field("Total Property Area (sq.m)")
    # Values from tables (regex is OK here)
    import re
    m = re.search(r'Capital Value \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['capital_value'] = m.group(1).replace(",", "")
    m = re.search(r'Land Value \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['land_value'] = m.group(1).replace(",", "")
    m = re.search(r'Rates - City Council \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['city_council_rates'] = m.group(1).replace(",", "")
    m = re.search(r'Rates - Regional Council \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['regional_council_rates'] = m.group(1).replace(",", "")
    m = re.search(r'Total Rates Charge \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['total_rates'] = m.group(1).replace(",", "")
    return result



if __name__ == "__main__":
    with open("rates_1998600.pdf", "rb") as f:

        with pdfplumber.open(f) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    parsed = parse_rates_pdf_text(text)
    print(parsed)

