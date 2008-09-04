#!/usr/bin/perl
#
# Copyright (C) 2006 Luke Reeves
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

package Insipid::Tags;

use strict;
use warnings;

use vars qw(@ISA @EXPORT @EXPORT_OK);
use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);
use Insipid::Config;
use Insipid::Database;
use Insipid::Sessions;
require Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(
show_tags
get_tags
get_tags_list
set_tags
tag_operations
);

sub tag_operations {
	print '<h2>Rename Tag</h2>';
	print '<select name="rename">';
	show_tags(1);
	print '</select>';
	print '<h2>Delete Tag</h2>';
	print '<select name="delete">';
	show_tags(1);
	print '</select>';
}

# Display the tag list.  Takes one parameter for the mode - 0 is for the
# sidebar, 1 is for a SELECT box. TODO: Cache the actual result set so
# that when there's more than one tag list on a page we only hit the database
# once.
sub show_tags {
	my ($mode) = shift;
	if(!defined($mode)) { $mode = 0; }
	
	my ($sql, $sth);
	if($mode eq 0) { print "<div id=\"leftside\">"; }

	# If the user has already chosen a tag, get the intersection list
	if(defined(url_param('tag')) && (logged_in() eq 1)) {
		$sql = "select $tbl_tags.name,count(*) from $tbl_bookmarks 
			inner join $tbl_bookmark_tags as bt1 on 
				($tbl_bookmarks.id = bt1.bookmark_id) 
			inner join $tbl_tags on 
				($tbl_tags.id = bt1.tag_id)
			inner join $tbl_bookmark_tags as bt2 on 
				($tbl_bookmarks.id = bt2.bookmark_id) 
			inner join $tbl_tags as t2 on 
				(t2.id = bt2.tag_id and t2.name = ?)
			where ($tbl_tags.name != ?)
			group by $tbl_tags.name";
		$sth = $dbh->prepare($sql);
		$sth->execute(url_param('tag'), url_param('tag'));

		if($sth->rows ne 0) {
			print "<div id=\"taglist\" style=\"\">";
			print "<table cellpadding =\"0\" cellspacing=\"0\" ";
			print 'class="tagsummarytable"><tbody>';
			print "<tr><td align=\"center\">";
			print "<div class=\"inline_title\">Add Tag</div></td>";
		
			while(my @rs = $sth->fetchrow_array()) {
				my $tt = url_param('tag');
				my $link = "$tag_url$tt+$rs[0]";
				$tt =~ s/ /\+/g;

				print "<tr><td>&nbsp;<span class=\"tagtabletext\">($rs[1])&nbsp;</span><a href=\"$link\">$rs[0]</a>&nbsp;";
				print "</tr></td>\n";
			}

			print "</tbody></table></div></div>";

			return;
		}
	}

	# Access_spec contains a where clause to count only public bookmarks 
	# if the user is not logged in
	my $access_where = "";
	if(logged_in() eq 0) {
		$access_where = " where ($tbl_bookmarks.access_level = 1) ";
	}

	my $order_clause;
	if($dbtype eq "Pg") {
		$order_clause = "order by upper($tbl_tags.name)";
	} else {
		$order_clause = "order by $tbl_tags.name";
	}

	$sql = "select $tbl_tags.name, count(*) 
		   from $tbl_bookmarks  
		   inner join $tbl_bookmark_tags on
			($tbl_bookmarks.id = $tbl_bookmark_tags.bookmark_id)
		   inner join $tbl_tags on
			($tbl_tags.id = $tbl_bookmark_tags.tag_id)
		   $access_where
		   group by $tbl_tags.name
		   $order_clause"; 

	$sth = $dbh->prepare($sql);
	$sth->execute;

	if($mode eq 0) {
		print '<div id="taglist" style="">';
		print '<table cellpadding="0" cellspacing="0" ';
		print 'class="tagsummarytable"><tbody>';
		print '<tr><td align="center"><div class="inline_title">';
		print 'Tag List</div></td>';
	}
	
	while(my @r = $sth->fetchrow_array) {
		if($mode eq 0) {
			print "<tr><td>&nbsp;<span class=\"tagtabletext\">($r[1])";
			print "&nbsp;</span><a href=\"$tag_url$r[0]\">$r[0]</a>&nbsp;";
			print "</td></tr>\n";
		} else {
			print "<option name=\"$r[0]\">$r[0]</option>";
		}
	}

	if($mode eq 0) {
		print "</tbody></table></div>";
		print "</div>";
	}
}

# Get a string representing a URLs tags
sub get_tags {
	my ($url) = (@_);
	my @tags = get_tags_list($url);

	my $rv = "";
	foreach (@tags) {
		$rv = "$rv $_";
	}

	# Trim leading whitespace
	$rv =~ s/^\s+//;
	return $rv;
}

# Get a list of the tags for a given URL id
sub get_tags_list {
	my ($url) = (@_);
	my $sql = "select $tbl_tags.name from $tbl_tags 
			inner join $tbl_bookmark_tags on 
				($tbl_tags.id = $tbl_bookmark_tags.tag_id) 
			inner join $tbl_bookmarks on
				($tbl_bookmark_tags.bookmark_id = $tbl_bookmarks.id)
			where ($tbl_bookmarks.url = ?)";
  
	my $sth = $dbh->prepare($sql);
	$sth->execute($url);

	my @tags;
	while(my @r = $sth->fetchrow_array) {
		push(@tags, $r[0]);
	}

	return @tags;
}

# Sets tags for a bookmark.  Takes a bookmark ID and a string
# representing the tags as parameters.
sub set_tags {
	my ($bookmark_id, $tag_string) = (@_);

	if(logged_in() ne 1) {
		push(@errors, "You have to be logged in to perform that operation.");
		return;
	}
	
	my @tags = split(" ", $tag_string);
	
	# Clear old tags first.
	my $sql = "delete from $tbl_bookmark_tags where (bookmark_id = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($bookmark_id);
	
	foreach my $cur (@tags) {
	    # check if this tag exists in tags table
	    my $sql = "select count(id) from $tbl_tags where (name = ?)";
	    my $sth = $dbh->prepare($sql);
	    $sth->execute($cur);
	    my @rv = $sth->fetchrow_array;
	    my $tagcount = $rv[0];

	    # or create a new tag
	    if ($tagcount < 1) {
		my $sql = "insert into $tbl_tags (name) values(?)";
		my $sth = $dbh->prepare($sql);
		$sth->execute($cur);
	    }

	    # and fetch the tag ID
	    $sql = "select id from $tbl_tags where (name = ?)";
	    $sth = $dbh->prepare($sql);
	    $sth->execute($cur);
	    my $tid = $sth->fetchrow_array;

	    $sql = "insert into $tbl_bookmark_tags(bookmark_id, tag_id) 
		  values( ? , ? )";
	    $sth = $dbh->prepare($sql);
	    $sth->execute($bookmark_id, $tid);
	}
}


1;
__END__
