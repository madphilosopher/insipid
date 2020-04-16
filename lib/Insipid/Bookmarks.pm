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

package Insipid::Bookmarks;

use strict;
use warnings;

use vars qw(@ISA @EXPORT @EXPORT_OK $icount $duplicates);
use Insipid::Config;
use Insipid::Database;
use Insipid::Schemas;
use Insipid::Sessions;
use Insipid::Tags;
use Insipid::Util;
use DBI qw/:sql_types/;;
use Date::Format;
use Date::Parse;
use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);
use Digest::MD5 qw(md5 md5_hex);

require Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(
add_bookmark
export_bookmarks
get_bookmark_id_by_url
$icount
$duplicates
);

sub get_bookmark_id_by_url {
	my ($url) = (@_);
	my $sql = "select $tbl_bookmarks.id from $tbl_bookmarks 
			where ($tbl_bookmarks.url = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($url);

	my @r = $sth->fetchrow_array;
	return $r[0];
}

sub add_bookmark {
	my ($url, $title, $description, $access_level, $epoch, $tags) = (@_);
	my ($sql, $sth);

	if(logged_in() ne 1) {
		push(@errors, 'You have to be logged in to perform ' .
			'that operation.');
		return;
	}

	my $md5 = md5_hex($url);

	# Check for duplicate
	$sql = "select title from $tbl_bookmarks where (md5 = ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute($md5);
	
	if($sth->rows ne 0) {
		$duplicates++;
		return;
	}

	$sql = "INSERT INTO $tbl_bookmarks 
		(url, md5, title, description, access_level, date) 
		VALUES (?, ?, ?, ?, ?, ?)";

	if($epoch eq 0) { $epoch = time; }
	$sth = $dbh->prepare($sql);

	$sth->execute($url, $md5, $title, $description, $access_level, $epoch)
		or die $DBI::errstr;
	
	$icount++;

	set_tags(get_bookmark_id_by_url($url), $tags);
}

sub export_bookmarks {
	my ($writer) = (@_);

	my ($sql, $sth, $last_id);

	$writer->startTag("posts");

	$sql = "select 
		  $tbl_bookmarks.id, $tbl_bookmarks.title, 
		  $tbl_bookmarks.date, $tbl_bookmarks.access_level, 
		  $tbl_bookmarks.url, $tbl_tags.name
		from $tbl_bookmarks
		left join $tbl_bookmark_tags on
		  ($tbl_bookmarks.id = $tbl_bookmark_tags.bookmark_id)
		left join $tbl_tags on
		  ($tbl_bookmark_tags.tag_id = $tbl_tags.id)";

  	$sth = $dbh->prepare($sql);
	$sth->execute();

	my ($url, $title);
	my $tags = "";

	my %last;
	$last_id = -1;
	my $current = 0;
	my $max = $sth->rows;

	# There HAS to be a better way to do this horrible looping for tags.
	while(my $hr = $sth->fetchrow_hashref) {
		$current++;

		# For the first bookmark
		if($last_id eq -1) {
		  $last_id = $hr->{'id'};
		  $last{title} = $hr->{'title'};
		  $last{url} = $hr->{'url'};
		  $last{tags} = "";
		  $last{timestamp} = $hr->{'date'};
		  $last{access_level} = $hr->{'access_level'};
		} 
		
		#if(($hr->{'id'} ne $last_id) || ($current eq $max)) {
		if($hr->{'id'} ne $last_id) {
		  # the id changed, so show the last mark.
		  #my $url = sanitize_html($last{'url'});
		  my $url = $last{'url'};
		  my $title = $last{'title'};
		  #my $title = sanitize_html($last{'title'});
		  #$title =~ s/"/&quot;/gi;
		  if(defined($last{tags})) {
		  	if($last{tags} eq "") {
		  		$last{tags} = "system:unfiled"; 
		  	}
		  } else {
		  	$last{tags} = "system:unfiled";
		  }
		  
		  if($last{url} ne "") {
		 	my $tstr = time2str("%Y-%m-%dT%TZ", $last{timestamp}, "GMT");
			$writer->emptyTag('post',
				'access_level' => $last{access_level},
				'href' => $url,
				'description' => $title,
				'tag' => $last{tags},
				'time' => $tstr);
		  }

		  # Swap the new one in.
		  $last_id = $hr->{'id'};
		  $last{title} = $hr->{'title'};
		  $last{url} = $hr->{'url'};
		  $last{tags} = $hr->{'name'};
		  $last{timestamp} = $hr->{'date'};
		  $last{access_level} = $hr->{'access_level'};
		} else {
		  # Add tag to the current bookmark
		  if($hr->{'name'}) {
			  $last{tags} = "$last{tags} $hr->{'name'}";
		  }
		}
	}
	
	if($last{'url'}) {
		#$url = sanitize_html($last{'url'});
		#$title = sanitize_html($last{'title'});
		#$title =~ s/"/&quot;/gi;
		
		$url = $last{'url'};
		$title = $last{'title'};
		
		if(defined($last{tags})) {
			if($last{tags} eq "") {
				$last{tags} = "system:unfiled"; 
			}
		} else {
			$last{tags} = "system:unfiled";
		}
		  
		if($last{url} ne "") {
			my $tstr = time2str("%Y-%m-%dT%TZ", $last{timestamp}, "GMT");
			$writer->emptyTag('post',
				'access_level' => $last{access_level},
				'href' => $url,
				'description' => $title,
				'tag' => $last{tags},
				'time' => $tstr);
		}
	}

	$writer->endTag("posts");
}

1;
__END__
