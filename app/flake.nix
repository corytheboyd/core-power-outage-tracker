{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  outputs =
    { nixpkgs, ... }:
    {
      devShells.aarch64-darwin.default =
        with nixpkgs.legacyPackages.aarch64-darwin;
        mkShell {
          buildInputs = [
            nodejs_24
            pmtiles
          ];
          shellHook = ''
            rm ./bin/shim/*
            ln -sf ${nodejs_24}/bin/node ./bin/shim/node
            npm install create-vite
          '';
        };
    };
}
