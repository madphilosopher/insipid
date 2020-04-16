#!/usr/bin/perl -T
#
# Copyright (C) 2008 Luke Reeves
#
# Modified by: Manuel de la Torre <mdltorre(a)gmail(dot)com>
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

use warnings;
use strict;

use XML::Writer;
use Date::Format;
use IO::File;

if(defined($ENV{SERVER_NAME})) {
	print "Content-Type: text/plain\r\n\r\nThis is a command-line tool.\n";
	exit;
}

if($#ARGV eq -1) {
	print "Usage: ./mozilla.pl <bookmarks filename>\n\n";
	exit;
}

my $output = new IO::File(">insipid.xml");
my $writer = new XML::Writer(OUTPUT => $output, DATA_MODE => 1, DATA_INDENT => 4);
my $count = 0;
my $currentLine;
my $currentTag;

$writer->xmlDecl('UTF-8');
$writer->startTag('insipid');
$writer->startTag('posts');

open(FH, $ARGV[0]);

while( defined($currentLine = <FH>) ) {

	
	if ($currentLine =~ /<H3.*\">(.*?)</) {
		if(defined($1)) {
			$currentTag = $1;
		}
	}
	
	if ($currentLine =~ /\/DL/) {
			$currentTag = '';
		}
			
	if ($currentLine =~ /<A\sHREF=\"(.*?)\".*?\".*?>(.*?)<\/A>/) {
	
		if(defined($1) && defined($2)) {
			$writer->emptyTag('post',
			'access_level' => '0',
			'href' => $1,
			'description' => $2,
			'tag' => $currentTag,
			'time' => time2str("%Y-%m-%dT%TZ", time(), 'GMT')
			);
		}
	
    }
}

$writer->endTag('posts');
$writer->endTag('insipid');
$writer->end();


