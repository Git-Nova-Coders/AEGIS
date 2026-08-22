"""
AEGIS Codebook Parser
Parses CDC BRFSS 2024 Codebook HTML (USCODE24_LLCP_082125.HTML)
Extracts exact variable definitions, questions, and categorical value mappings.
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

RAW_CODEBOOK_PATH = Path("data/raw/USCODE24_LLCP_082125.HTML")
OUTPUT_JSON_PATH = Path("data/processed/codebook_definitions.json")

CANDIDATE_VARS = [
    "_PHYS14D", "PHYSHLTH", "_RFHLTH", "POORHLTH", "GENHLTH",
    "_AGE_G", "SEXVAR", "_BMI5", "_SMOKER3", "DIABETE4",
    "CVDINFR4", "CVDCRHD4", "CVDSTRK3", "ASTHMA3", "CHCCOPD3",
    "CHCKDNY2", "HAVARTH4", "EXERANY2", "EDUCA", "INCOME3",
    "PRIMINS2", "PERSDOC3", "MEDCOST1"
]


def parse_codebook(html_path: Path, variables: list[str]) -> dict:
    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    results = {}
    tables = soup.find_all("table")

    for table in tables:
        # Normalize non-breaking spaces and whitespace
        table_text = " ".join(table.get_text().split())
        for var in variables:
            # Match exact variable name preceded by 'SAS Variable Name:'
            if f"SAS Variable Name: {var}" in table_text:
                header_text = ""
                values_map = []

                for r in table.find_all("tr"):
                    cells = [" ".join(td.get_text().split()) for td in r.find_all(["td", "th"])]
                    if not cells:
                        continue
                    if len(cells) == 1 and "SAS Variable Name:" in cells[0]:
                        header_text = cells[0]
                    elif len(cells) >= 2 and cells[0] != "Value":
                        values_map.append({
                            "value": cells[0],
                            "label": cells[1],
                            "frequency": cells[2] if len(cells) > 2 else "",
                            "percentage": cells[3] if len(cells) > 3 else ""
                        })

                # Extract Question and Label from header_text
                label_match = re.search(r"Label:\s*([^S]+?)(?=Section Name:|$)", header_text)
                question_match = re.search(r"Question:\s*(.*?)$", header_text)

                results[var] = {
                    "variable_name": var,
                    "label": label_match.group(1).strip() if label_match else "",
                    "question": question_match.group(1).strip() if question_match else "",
                    "header_raw": header_text,
                    "values": values_map
                }

    return results


def main():
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    parsed = parse_codebook(RAW_CODEBOOK_PATH, CANDIDATE_VARS)
    print(f"Successfully extracted {len(parsed)} / {len(CANDIDATE_VARS)} variables from codebook.")

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(parsed, f, indent=2)

    print(f"Saved parsed codebook to {OUTPUT_JSON_PATH}")

    # Display summary of all parsed variables
    for var, data in parsed.items():
        print("=" * 60)
        print(f"VARIABLE: {var}")
        print(f"Label:    {data['label'].encode('ascii', 'replace').decode('ascii')}")
        print(f"Question: {data['question'].encode('ascii', 'replace').decode('ascii')}")
        print("Values:")
        for v in data["values"]:
            clean_label = v['label'].encode('ascii', 'replace').decode('ascii')
            print(f"  {v['value']:>10} -> {clean_label} ({v['percentage']}%)")


if __name__ == "__main__":
    main()
