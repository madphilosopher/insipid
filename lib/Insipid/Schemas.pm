#!/usr/bin/perl
#
# Copyright (C) 2008 Luke Reeves
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307
# USA
#

package Insipid::Schemas;

use strict;
use warnings;
use Insipid::Config;

use vars qw(
@ISA
@EXPORT
$createMySQL
$createPostgres
);

use Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(
$version
$createMySQL
$createPostgres
);

# Insipid will check the database version number on each initialization of
# the options table (every hit essentially) and upgrade the tables if there's
# any mismatch.
our $version = "0.9.20";

our $createPostgres = <<CPOSTGRES;
CREATE TABLE $tbl_authentication (
	session_id CHAR(32) NOT NULL UNIQUE,
	create_time INT,
	PRIMARY KEY(session_id)
);

CREATE TABLE $tbl_bookmarks (
	id SERIAL,
	url TEXT NOT NULL,
	md5 CHAR(32) NOT NULL UNIQUE,
	date INT NOT NULL DEFAULT 0,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	access_level INT NOT NULL DEFAULT 0,
	PRIMARY KEY(id)
);


CREATE TABLE $tbl_tags (
	id SERIAL,
	name VARCHAR(255) NOT NULL UNIQUE,
	PRIMARY KEY(id),
	UNIQUE(name)
);

CREATE TABLE $tbl_bookmark_tags (
	bookmark_id SERIAL,
	tag_id INT NOT NULL,
	PRIMARY KEY(bookmark_id, tag_id)
);

CREATE TABLE $tbl_options (
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY(name)
);

CREATE TABLE $tbl_pagecache (
        md5 CHAR(32) NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '',
        content_type VARCHAR(50),
        content_length INT NOT NULL DEFAULT 0,
        content bytea,
        date INT NOT NULL DEFAULT 0,
        PRIMARY KEY(md5)
);

CREATE TABLE $tbl_pagecache_references (
        md5_parent CHAR(32) NOT NULL DEFAULT '',
        md5_child CHAR(32) NOT NULL DEFAULT '',
        PRIMARY KEY(md5_parent, md5_child)
);

INSERT INTO $tbl_options VALUES (
  'feed_name',
  'The title of your feed (e.g. My Bookmarks)',
  'Bookmarks'
);

INSERT INTO $tbl_options VALUES (
  'site_name',
  'The title of the main page (e.g. My Bookmarks)',
  'My Bookmarks'
);


INSERT INTO $tbl_options VALUES (
  'public_searches',
  'Allow public searches - when set to yes, any visitor can search your bookmarks.',
  'no'
);

INSERT INTO $tbl_options VALUES(
  'version',
  'Internal Insipid version number',
  '$version'
);

INSERT INTO $tbl_options VALUES(
  'proxy_host',
  'The proxy server (if any) to use when making page snapshots.',
  ''
);

INSERT INTO $tbl_options VALUES(
  'proxy_port',
  'Your proxy port number.',
  '3128'
);

INSERT INTO $tbl_options VALUES(
  'use_rewrite',
  'Use mod_rewrite - disable this if you do not want .htaccess-controlled URLs, or if your Apache does not have the rewrite module installed.',
  'no'
);

CPOSTGRES


our $createMySQL = <<CMYSQL;
CREATE TABLE IF NOT EXISTS $tbl_authentication (
	session_id CHAR(32) NOT NULL UNIQUE,
	create_time INT,
	PRIMARY KEY(session_id)
);

CREATE TABLE IF NOT EXISTS $tbl_bookmarks (
	id INT AUTO_INCREMENT NOT NULL,
	url TEXT NOT NULL DEFAULT '',
	md5 CHAR(32) NOT NULL DEFAULT '' UNIQUE,
	date INT NOT NULL DEFAULT 0,
	title VARCHAR(255) NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	access_level INT NOT NULL DEFAULT 0,
	PRIMARY KEY(id)
);


CREATE TABLE IF NOT EXISTS $tbl_tags (
	id INT AUTO_INCREMENT NOT NULL,
	name VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,
	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS $tbl_bookmark_tags (
	bookmark_id INT NOT NULL,
	tag_id INT NOT NULL,
	PRIMARY KEY(bookmark_id, tag_id),
	INDEX(bookmark_id),
	INDEX(tag_id)
);


CREATE TABLE IF NOT EXISTS $tbl_options (
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        value TEXT NOT NULL DEFAULT '',
        PRIMARY KEY(name)
);

CREATE TABLE IF NOT EXISTS $tbl_pagecache (
        md5 CHAR(32) NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '',
        content_type VARCHAR(50),
        content_length INT NOT NULL DEFAULT 0,
        content LONGBLOB,
        date INT NOT NULL DEFAULT 0,
        PRIMARY KEY(md5)
);

CREATE TABLE IF NOT EXISTS $tbl_pagecache_references (
        md5_parent CHAR(32) NOT NULL DEFAULT '',
        md5_child CHAR(32) NOT NULL DEFAULT '',
        PRIMARY KEY(md5_parent, md5_child)
);

INSERT IGNORE INTO $tbl_options VALUES(
  'feed_name',
  'The title of your feed (e.g. My Bookmarks)',
  'Bookmarks'
);

INSERT IGNORE INTO $tbl_options VALUES(
  'site_name',
  'The title of the main page (e.g. My Bookmarks)',
  'My Bookmarks'
);

INSERT IGNORE INTO $tbl_options VALUES(
  'public_searches',
  'Allow public searches - when set to yes, any visitor can search your bookmarks.',
  'no'
);

INSERT IGNORE INTO $tbl_options VALUES(
  'proxy_host',
  'The proxy server (if any) to use when making page snapshots.',
  ''
);


INSERT IGNORE INTO $tbl_options VALUES(
  'proxy_port',
  'Your proxy port number.',
  '3128'
);

INSERT IGNORE INTO $tbl_options VALUES(
  'version',
  'Internal Insipid version number',
  '$version'
);

INSERT IGNORE INTO $tbl_options VALUES(
  'use_rewrite',
  'Use mod_rewrite - disable this if you do not want .htaccess-controlled URLs, or if your Apache does not have the rewrite module installed.',
  'no'
);
CMYSQL

1;
__END__
