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

package Insipid::Config;

use strict;
use warnings;

use CGI qw/:standard/;

use vars qw(@ISA @EXPORT $pagepath $site_url $tag_url $feed_url $full_url 
	$tbl_authentication $tbl_bookmarks $tbl_tags $tbl_options
	$tbl_bookmark_tags $tbl_pagecache $tbl_pagecache_references
	@errors);
@ISA = qw(Exporter);
@EXPORT = qw(getconfig $pagepath $site_url $tag_url $feed_url 
		$tbl_authentication $tbl_bookmarks $tbl_tags
		$tbl_options $tbl_bookmark_tags $tbl_pagecache
		$tbl_pagecache_references $full_url @errors);

my $config_file;
my %config;

if(-e "insipid-config.cgi") { $config_file = "insipid-config.cgi"; }
if(-e "../insipid-config.cgi") { $config_file = "../insipid-config.cgi"; }

# Read basic database and user configuration
open (CFG, $config_file);
while(my $line = <CFG>) {
	if($line =~ /^[^#]/) {
		$line =~ /(.*?)\s*=\s*(.*?)\s/;
		if(defined($1)) {
			if(defined($2)) {
				$config{$1} = $2;
			} else {
				$config{$1} = "";
			}
		}
	}
}
close(CFG);

sub getconfig {
	my ($key) = (@_);
	return $config{$key};
}

my $prefix = $ENV{'HTTPS'} ? 'https://' : 'http://';
my $port = '';
if(defined($ENV{'SERVER_PORT'})) {
	if($ENV{'SERVER_PORT'} ne '80') {
		$port = ':' . $ENV{'SERVER_PORT'};
	}
}

# Override the port from the configuration file if available
if(defined(getconfig('server_port'))) {
	if(getconfig('server_port') ne '') {
		$port = ':' . getconfig('server_port');
	}
}

$site_url = $prefix . virtual_host() . $port . getconfig('pagepath');

my $dbprefix;
if(defined(getconfig('dbprefix'))) {
	$dbprefix = getconfig('dbprefix');
} else {
	$dbprefix = '';
}

# Table names.
$tbl_authentication 		= $dbprefix . 'authentication';
$tbl_bookmarks			= $dbprefix . 'bookmarks';
$tbl_tags			= $dbprefix . 'tags';
$tbl_bookmark_tags		= $dbprefix . 'bookmark_tags';
$tbl_options			= $dbprefix . 'options';
$tbl_pagecache			= $dbprefix . 'pagecache';
$tbl_pagecache_references	= $dbprefix . 'pagecache_references';



1;

__END__

