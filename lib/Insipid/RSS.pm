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

package Insipid::RSS;

use warnings;
use strict;

use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);

use Insipid::Config;
use Insipid::Database;
use Insipid::Sessions;
use Insipid::Util;

use vars qw(@ISA @EXPORT $dbh);
require Exporter;

@ISA = qw(Exporter);
@EXPORT = qw(send_rss);

sub send_rss {
	my @parms;
	my $ew = "";
	my $joins = "";
	my $title = get_option("feed_name");
	
	if(url_param('tag')) {
                if(url_param('tag') =~ / /) {
                        my @tags = split(/ /, url_param('tag'));
                        my $rcount = 1;

                        foreach(@tags) {
                                push(@parms, $_);
                                $joins = "$joins inner join $tbl_bookmark_tags 
					as bt$rcount on
                                          ($tbl_bookmarks.id = bt$rcount.bookmark_id)
                                        inner join $tbl_tags as t$rcount on
                                           (t$rcount.id = bt$rcount.tag_id and t$rcount.name = ?) ";
                                $rcount++;
                        }
		} else {

			push(@parms, url_param('tag'));
			$joins = "
				inner join $tbl_bookmark_tags on 
					($tbl_bookmarks.id = 
						$tbl_bookmark_tags.bookmark_id)
				inner join $tbl_tags on
					($tbl_bookmark_tags.tag_id = $tbl_tags.id)";
			$ew = "and ($tbl_tags.name = ?)";
		}
	}

	my $access_where = "where (access_level = 1)";
	if(logged_in() eq 1) {
		$access_where = "";
	}

	my $sql = "
		select $tbl_bookmarks.id, $tbl_bookmarks.title, $tbl_bookmarks.url
			from $tbl_bookmarks $joins $access_where $ew
		order by $tbl_bookmarks.date desc limit 30";

	my $sth = $dbh->prepare($sql);
	$sth->execute(@parms);

	print <<RDFHEADER;
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
    xmlns:admin="http://webns.net/mvcb/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:content="http://purl.org/rss/1.0/modules/content/">
    
<channel>
  <title>$title</title>
  <link>$full_url</link>
  <description>Aggregated links</description>
  <dc:language>en-us</dc:language>
  <dc:creator>Insipid</dc:creator>
  <dc:rights>Copyright 2006</dc:rights>
RDFHEADER

	while(my @hr = $sth->fetchrow_array) {
	  my $url = sanitize_html($hr[2]);
	  my $title = sanitize_html($hr[1]);
	  print <<ITEM;
<item>
  <title>$title</title>
  <link>$url</link>
  <guid isPermaLink="false">$hr[0]_$full_url</guid>
  <content:encoded><![CDATA[<a href="$url">$hr[1]</a>]]></content:encoded>
</item>
ITEM
	}

	print "</channel></rss>\n\n";
}

1;
__END__
