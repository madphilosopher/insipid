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

package Insipid::LinkExtractor;

use strict;
use warnings;
use HTML::Parser;
use HTML::Entities ();
use URI::URL;
use URI::WithBase;
use Digest::MD5 qw(md5 md5_hex);
use Insipid::Config;
use Insipid::Database;
use Insipid::Snapshots;

use vars qw(@ISA);
@ISA = qw(HTML::Parser);

my $url = '';

sub new {
	my $pack = shift;
	$url = shift;
	my $self = $pack->SUPER::new;
	$self;
}

sub declaration {
	my $self = shift;
	my ($decl) = @_;

	1;
}

sub start {
	my $self = shift;
	my ($tag, $attr, $attrseq, $origtext) = @_;

	#print "Found tag $tag<br />";
	if($tag eq 'a') {
		my $href = $attr->{'href'};
		if(defined($href)) {
			if($href =~ /(\.gif|\.jpg|\.png)/i) {
				grab_image($url, $href);
			}
		}
	}

	1;
}

sub grab_image {
	my ($base_url, $t) = (@_);
	my ($sql, $sth);
	
	my $u1 = URI::WithBase->new($t, $base_url);
	my $target_url = $u1->abs;
	
	print "Fetching $target_url... ";

	my $target_md5 = md5_hex($target_url);

	# Check if this already exists.
	$sql = "select count(*) from $tbl_pagecache where (md5 = ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute($target_md5);
	my @r = $sth->fetchrow_array();

	if($r[0] ne 0) {
		print " Already exists. <br />";
		return;
	}

	my $rv = Insipid::Snapshots::fetch_url($target_url, $base_url);

	if($rv eq 0) {
		$sql = "insert into $tbl_pagecache_references(
			md5_parent, md5_child) values(?, ?)";
		$sth = $dbh->prepare($sql);
		$sth->execute(md5_hex($base_url), $target_md5);
	
		print "OK.<br />";
	}
	
	1;
}

sub end {
	my $self = shift;
	my ($tag) = @_;

	1;
}

sub text {
	my $self = shift;
	my ($text) = @_;

	1;
}

sub comment {
	my $self = shift;
	my ($comment) = @_;

	1;
}
	
1;

