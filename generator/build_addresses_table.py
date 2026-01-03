import pandas
from loguru import logger
from probableparsing import RepeatedLabelError

from lib.AddressModel import AddressModel
from lib.Config import Config


def main():
    config = Config.from_file("config.yml")
    zipcodes = config.zipcodes

    dfs = []
    for zipcode in zipcodes:
        file = f"data/addresses_{zipcode}.parquet"
        try:
            df = pandas.read_parquet(file)
            dfs.append(df)
            logger.info(f"Loaded {len(df)} rows from {file}")
        except FileNotFoundError:
            logger.warning(f"File not found: {file}")

    if len(dfs) == 0:
        return

    combined = pandas.concat(dfs, ignore_index=True)
    logger.info(f"Combined {len(combined)} total rows from {len(dfs)} files")

    # Filter out rows with null required fields
    before_count = len(combined)
    combined = combined[
        combined["StreetName"].notna()
        & combined["PlaceName"].notna()
        & combined["AddrNum"].notna()
    ]
    after_count = len(combined)
    if before_count != after_count:
        logger.info(
            f"Filtered out {before_count - after_count} rows with null required fields"
        )

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

    rows = combined.iterrows()
    logger.info(f"Normalize rows...")
    normalized_rows = []
    i = 0
    for _, row in rows:
        address_model = AddressModel(**row.to_dict())
        try:
            normalized_address = address_model.normalized_address()
        except RepeatedLabelError as e:
            logger.error(f"Failed to parse row: {row.to_dict()}")
            raise e
        normalized_rows.append(
            {
                "id": address_model.id,
                "address": normalized_address,
                "city": address_model.city.strip().title(),
                "county": address_model.county.strip().title(),
                "zipcode": address_model.zipcode.strip(),
                "location": row["geometry"],
            }
        )
        i += 1
        if i % 10_000 == 0:
            logger.info(f"Normalized {i} rows...")

    logger.info(f"Successfully converted {len(normalized_rows)} rows")

    # Create new DataFrame with normalized data
    normalized_df = pandas.DataFrame(normalized_rows)
    normalized_df.to_parquet("data/addresses.parquet")
    logger.info("Saved to data/addresses.parquet")


if __name__ == "__main__":
    main()
