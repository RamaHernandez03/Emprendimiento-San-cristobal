#!/bin/sh
set -eu

build_dir="dist"
rm -rf "$build_dir"
mkdir -p "$build_dir"

cp index.html alta-vendedor.html panel.html "$build_dir/"
cp styles.css enhancements.css portal.css approval.css "$build_dir/"
cp script.js alta-vendedor.js panel.js supabase-config.js "$build_dir/"
cp robots.txt sitemap.xml "$build_dir/"
cp -R assets "$build_dir/assets"
