@sync_addresses:
    cd ./generator && just download_addresses build_addresses
    cp ./generator/data/addresses.parquet ./app/public/
