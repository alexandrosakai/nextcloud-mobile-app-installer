<?php

/*
 * WARNING
 *
 * This file gets modified by automatic processes and all lines that are not
 * active code (ie. comments) are lost during that process.
 *
 * If you want to document things with comments or use constants add your settings
 * in a '<NAME>.config.php' file which will be included and rendered into this file.
 *
 * Example:
 *   <?php
 *   $CONFIG = [];
 *
 * See also: https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/config_sample_php_parameters.html#multiple-merged-configuration-files
 */
$CONFIG = array (
  'passwordsalt' => 'CHANGE_ME',
  'secret' => 'CHANGE_ME',
  'trusted_domains' => 
  array (
    0 => 'chat.example.com',
  ),
  'datadirectory' => '/var/nextcloud-data',
  'dbtype' => 'mysql',
  'version' => '35.0.2.2',
  'overwrite.cli.url' => 'https://chat.example.com',
  'instanceid' => 'CHANGE_ME',
  'dbname' => 'CHANGE_ME',
  'dbhost' => 'CHANGE_ME',
  'dbtableprefix' => 'oc_',
  'mysql.utf8mb4' => true,
  'dbuser' => 'CHANGE_ME',
  'dbpassword' => 'CHANGE_ME',
  'installed' => true,
  'overwriteprotocol' => 'https',
  'default_phone_region' => 'BR',
  'default_language' => 'pt_BR',
  'default_locale' => 'pt_BR',
  'maintenance_window_start' => 5,
  'memcache.local' => '\\OC\\Memcache\\APCu',
  'memcache.locking' => '\\OC\\Memcache\\Redis',
  'memcache.distributed' => '\\OC\\Memcache\\Redis',
  'redis' => 'CHANGE_ME',
  array (
    'host' => '127.0.0.1',
    'port' => 6379,
  ),
  'maintenance' => false,
  'force_language' => 'pt_BR',
  'force_locale' => 'pt_BR',
  'defaultapp' => 'spreed,files',
  'skeletondirectory' => '/var/nextcloud-branding/modelo-usuario',
  'templatedirectory' => '/var/nextcloud-branding/modelo-modelos',
  'theme' => '',
  'trusted_proxies' => 
  array (
    0 => '127.0.0.1',
    1 => '::1',
    2 => '203.0.113.10',
  ),
  'loglevel' => 2,
);
