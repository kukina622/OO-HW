#!/bin/sh

cd ..

cat sql/drop-table.sql | ./mssql
cat sql/create-table.sql | ./mssql
# cat sql/insert.sql | ./mssql