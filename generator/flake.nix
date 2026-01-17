{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  outputs =
    { nixpkgs, ... }:
    {
      devShells.aarch64-darwin.default =
        with nixpkgs.legacyPackages.aarch64-darwin;
        mkShell {
          buildInputs = [
            python3
            uv
            pmtiles
            tippecanoe
          ];
          shellHook = ''
            rm ./bin/shim/*
            ln -sf ${python3}/bin/python ./bin/shim/python
          '';
        };
    };
}
