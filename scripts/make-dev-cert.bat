makecert -sv metastream-dev.pvk -n "CN=MetastreamDev" metastream-dev.cer -b 05/08/2018 -e 11/01/2018 -r
pvk2pfx -pvk metastream-dev.pvk -spc metastream-dev.cer -pfx metastream-dev.pfx -po password
