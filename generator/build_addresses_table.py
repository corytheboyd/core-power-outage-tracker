import pandas as pd
import usaddress
from loguru import logger

from lib.Config import Config


def normalize_address(address: str) -> str:
    """Normalize address using usaddress parser and title case."""
    if not address or pd.isna(address):
        return address

    try:
        parsed, _ = usaddress.tag(address)
        # Reconstruct address in normalized order with title case
        parts = []
        if "AddressNumber" in parsed:
            parts.append(parsed["AddressNumber"])
        if "StreetNamePreDirectional" in parsed:
            parts.append(parsed["StreetNamePreDirectional"].title())
        if "StreetName" in parsed:
            parts.append(parsed["StreetName"].title())
        if "StreetNamePostType" in parsed:
            parts.append(parsed["StreetNamePostType"].title())
        if "StreetNamePostDirectional" in parsed:
            parts.append(parsed["StreetNamePostDirectional"].title())
        if "OccupancyType" in parsed:
            parts.append(parsed["OccupancyType"].title())
        if "OccupancyIdentifier" in parsed:
            parts.append(parsed["OccupancyIdentifier"])
        return " ".join(parts).strip() if parts else address.title().strip()
    except Exception:
        # Fall back to title case if parsing fails
        return address.title().strip()


config = Config.from_file("config.yml")
zipcodes = config.zipcodes

dfs = []
for zipcode in zipcodes:
    file = f"data/addresses_{zipcode}.parquet"
    try:
        df = pd.read_parquet(file)
        dfs.append(df)
        logger.info(f"Loaded {len(df)} rows from {file}")
    except FileNotFoundError:
        logger.warning(f"File not found: {file}")

if dfs:
    combined = pd.concat(dfs, ignore_index=True)
    logger.info(f"Combined {len(combined)} total rows from {len(dfs)} files")

    # Filter out rows with null addresses or place names
    before_count = len(combined)
    combined = combined[combined["AddrFull"].notna() & combined["PlaceName"].notna()]
    after_count = len(combined)
    if before_count != after_count:
        logger.info(f"Filtered out {before_count - after_count} rows with null addresses or place names")

    # Apply replacement rules
    for rule in config.cleanup_rules.replace:
        before = combined[rule.field].value_counts().get(rule.match, 0)
        if before > 0:
            combined[rule.field] = combined[rule.field].replace(
                rule.match, rule.replacement
            )
            logger.info(
                f"Replaced {before} instances of '{rule.match}' with '{rule.replacement}' in {rule.field}"
            )

    # Apply exclusion rules
    for rule in config.cleanup_rules.exclude:
        before_count = len(combined)
        combined = combined[combined[rule.field] != rule.match]
        after_count = len(combined)
        if before_count != after_count:
            logger.info(
                f"Excluded {before_count - after_count} rows where {rule.field} = '{rule.match}'"
            )

    # Normalize addresses and place names
    logger.info("Normalizing addresses...")
    combined["AddrFull"] = combined["AddrFull"].apply(normalize_address)
    logger.info("Normalizing place names...")
    combined["PlaceName"] = combined["PlaceName"].apply(
        lambda x: x.title().strip() if x and not pd.isna(x) else x
    )
    logger.info("Normalization complete")

    combined.to_parquet("data/addresses.parquet")
    logger.info("Saved to data/addresses.parquet")
else:
    logger.error("No parquet files found to combine")
