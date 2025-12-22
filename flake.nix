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
          shellHook = ''
            ln -sf ${nodejs_24}/bin/node ./bin/shim/node
            ln -sf ${nodePackages.pnpm}/bin/pnpm ./bin/shim/pnpm
            ln -sf ${go_1_25}/bin/go ./bin/shim/go
            ln -sf ${duckdb}/bin/duckdb ./bin/shim/duckdb
          '';
        };
    };
}
