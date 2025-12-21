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
            nodePackages.pnpm
            go_1_25
            duckdb
          ];
        };
    };
}
