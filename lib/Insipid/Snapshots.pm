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

package Insipid::Snapshots;

use strict;
use warnings;

use vars qw(@ISA @EXPORT);
use Insipid::Config;
use Insipid::Database;
use Insipid::Util;
use Insipid::LinkExtractor;
use Insipid::Parser;
use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);
use Date::Format;
use Date::Parse;
use Date::Parse;
use Digest::MD5 qw(md5 md5_hex);
use DBI qw/:sql_types/;;
use LWP::UserAgent;
use HTTP::Request;
use MIME::Base64;
use XML::Writer;

require Exporter;


@ISA = qw(Exporter);

@EXPORT = qw(
show_snapshots
do_snapshot
delete_snapshot
export_snapshots
show_snapshot
fetch_related
parsepage
fetch_url
);

my $ua = LWP::UserAgent->new(timeout=>30);
if(get_option('proxy_host') ne '') {
	my $proxy_host = get_option('proxy_host');
	my $proxy_port = get_option('proxy_port');
	$ua->proxy(['http', 'ftp'], "http://$proxy_host:$proxy_port/");
}
	

my $referer = "";

sub export_snapshots {
	my ($writer) = (@_);
	my ($sql, $sth, @rs);

	# Export the objects
	$writer->startTag('objects');
	$sql = "select md5, url, content_type, content_length, date, content
		from $tbl_pagecache";
	$sth = $dbh->prepare($sql);
	$sth->execute();
	
	while(@rs = $sth->fetchrow_array()) {
		$writer->startTag('object',
				'md5' => $rs[0],
				'url' => $rs[1],
				'type' => $rs[2],
				'length' => $rs[3],
				'date' => $rs[4]
				);
		$writer->characters(encode_base64($rs[5]));
		$writer->endTag("object");
	}
	$writer->endTag('objects');	

	# Export the relationships 
	$writer->startTag('relationships');

	$sql = "select md5_parent, md5_child from $tbl_pagecache_references";
	$sth = $dbh->prepare($sql);
	$sth->execute();

	while(@rs = $sth->fetchrow_array()) {
		$writer->startTag("relationship",
				"parent" => $rs[0],
				"child" => $rs[1]);
		$writer->endTag("relationship");
	}
	
	$writer->endTag("relationships");

}

# TODO: Make the insert_snapshot callable by this and the import method.
sub fetch_url {
	my ($url, $roverride) = (@_);

	# TODO: No.
	if(defined($roverride)) { $referer = $roverride; }
	my $md5 = md5_hex($url);

	my $req = HTTP::Request->new(GET => $url) or die "Can't fetch page: $!\n";

	if($referer ne '') { $req->header( referer => $referer ); }

	my $res = $ua->request($req);

	if($res->is_success) {
		my $content = $res->content;

		# Shove the unparsed page into the cache.
		my $sql = "insert into $tbl_pagecache(md5, url, content_type, 
				content_length, content, date)
			values ( ? , ? , ? , ? , ? , ? )";

		my $sth = $dbh->prepare($sql);
		my $ct = $res->header('Content-Type');
		if(length($ct) > 50) { $ct = substr($ct, 0, 50); }

		$sth->bind_param(1, $md5);
		$sth->bind_param(2, $url);
		$sth->bind_param(3, $ct);
		$sth->bind_param(4, length($content));

		# Postgres needs escaping for the binary data.
		if($dbtype eq 'Pg') {
			$sth->bind_param(5, $content, SQL_VARBINARY);
		} else {
			$sth->bind_param(5, $content);
		}
		$sth->bind_param(6, time());
		$sth->execute;

		if($sth->err) {
		#	print $sth->errstr;
		#	print "<br />";
			return 1;			 
		} else {
			if($ct =~ /text\/html/i) {
				print '<br />Parsing page... ';
				parsepage($url, $content, $ct);
				print 'done.';
			}

			return 0;
		}
	} else {
		my $err = $res->status_line;
		print "$err<br />";

		return 1;
	}
}

sub show_snapshot {
	my ($md5) = (@_);
	my ($sql, $sth, @row);
	my %internalLinks = ();

	$sql = "select content_type,content,url,date,content_length
			from $tbl_pagecache where (md5 = ?)";
		
	$sth = $dbh->prepare($sql);
	$sth->execute($md5);
	
	@row = $sth->fetchrow_array;
	
	if(!@row) {
		print 'Content-Type: text/plain\r\n\r\n';
		print "Can't find cached item \"$md5\"";
		return;
	}


	# Check for IMS request.
	my $ims = http('If-Modified-Since');
	if($ims) { 

		my $t = str2time($ims);

		if($row[3] <= $t) {
			# Return a 304 not modified.
			print 'Status: 304 Not Modified\r\n';
			return;
		}
	}
	
	my $dt = ims_time($row[3]);
	print "Last-Modified: $dt\r\n";
	print "Content-Type: $row[0]\r\n";

	if($row[0] =~ /text\/html/i) {
		# Now we get a list of URLs that can be redirected to our 
		# local snapshot cache. We'll use that to build a hash of 
		# URL->MD5 values and match outputted links against that.
		my ($resql, $resth, @rerow);
		$resql = "select $tbl_pagecache_references.md5_child,
			$tbl_pagecache.url
			from $tbl_pagecache_references
			inner join $tbl_pagecache on 
				($tbl_pagecache_references.md5_child = 
					$tbl_pagecache.md5)
			where (md5_parent = ?)";
		$resth = $dbh->prepare($resql);
		$resth->execute($md5);

		while(@rerow = $resth->fetchrow_array()) {
			$internalLinks{$rerow[1]} = $rerow[0];
		}

		print "\r\n";
		my $p = Insipid::Parser->new($row[2], undef);
		$p->setSnapshotMap(\%internalLinks);
		
		if($row[0] =~ /utf/i) {
			$p->utf8_mode(1);
		}
		$p->parse($row[1]);
	} else {
		print "Content-Length: $row[4]\r\n";
		print "\r\n";
		print $row[1];
	}

	exit;
}

sub show_details {
	my ($md5) = @_;
	my ($sth, $sql);
	
	$sql = "select $tbl_bookmarks.title from $tbl_bookmarks
		where ($tbl_bookmarks.md5 = ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute($md5);
	my @row = $sth->fetchrow_array();

	print '<h3>Cache Details for "';
	print escapeHTML($row[0]);
	print '"</h3>';
	print '<br /><center><table cellpadding="5"><tr><th>View</th><th>URL</th><th>';
	print 'Type</th><th>Size</th><th>Ref Count</th></tr>';

	$sql = "select $tbl_pagecache.md5, $tbl_pagecache.url, 
			$tbl_pagecache.content_type,
			$tbl_pagecache.content_length, 
			pg2.md5_parent, count(*)
			from $tbl_pagecache_references
			inner join $tbl_pagecache on 
				($tbl_pagecache_references.md5_child = 
					$tbl_pagecache.md5)
			left join $tbl_pagecache_references as pg2 on 
				(pg2.md5_child = $tbl_pagecache.md5)
			where ($tbl_pagecache_references.md5_parent = ?)
			group by $tbl_pagecache.md5, $tbl_pagecache.url, 
				$tbl_pagecache.content_type, pg2.md5_parent, 
				$tbl_pagecache.content_length, pg2.md5_child
			order by $tbl_pagecache.url";
				
	$sth = $dbh->prepare($sql);
	$sth->execute($md5);

	while(my @rs = $sth->fetchrow_array()) {
		print '<tr><td>';
		my $ss = "$snapshot_url$rs[0]";
		
		print "<a href=\"$rs[1]\">live</a>/<a href=\"$ss\">snapshot</a>";
		print '</td><td>';
		print $rs[1];
		print '</td><td>';
		print $rs[2];
		print '</td><td>';
		print $rs[3];
		print '</td><td>';
		print $rs[5];
		print '</td></tr>';
	}

	print '</table></center>';
}

#
# Show a nice menu of the users snapshots.
#
sub show_snapshots {

	# If a snapshot was asked to be deleted
	if(defined(param('delete'))) {
		delete_snapshot(param('delete'));
	}

	if(defined(param('md5'))) {
		show_details(param('md5'));
		return;
	}

	my $tcount = 0;
	my $tsize = 0;
	
	my $sql = "select $tbl_pagecache.md5, $tbl_bookmarks.title, 
				$tbl_pagecache.date,
				$tbl_pagecache.content_length + 
			  	coalesce(sum(p2.content_length), 0), 
			  	count(*) - 1, $tbl_bookmarks.access_level
			from $tbl_pagecache 
			inner join $tbl_bookmarks on 
				($tbl_bookmarks.md5 = $tbl_pagecache.md5)
			left join $tbl_pagecache_references on 
			   ($tbl_pagecache.md5 = $tbl_pagecache_references.md5_parent) 
		        left join $tbl_pagecache as p2 on
		           (p2.md5 = $tbl_pagecache_references.md5_child)
			group by 
				$tbl_bookmarks.access_level,
				$tbl_pagecache.md5, $tbl_bookmarks.title,
				$tbl_pagecache.date, $tbl_pagecache.content_length
			order by $tbl_pagecache.date desc";
	my $sth = $dbh->prepare($sql);
	$sth->execute;
	
	print '<br /><center><table cellpadding=\"5\"><tr><th>Page</th><th>';
	print 'Date</th><th>Size</th><th>Objects</th><th>Functions</th></tr>';

	my $count = 0;

	while(my @r = $sth->fetchrow_array) {

		$count++;
		
		my $color;
		if(($count % 2) eq 1) {
			$color = ' bgcolor="#EEEEEE" ';
		} else {
			$color = '';
		}
		
		print "<tr $color>";
		print '<td>';
		
		print "<a href=\"$snapshot_url$r[0]\">";
		if($r[5] eq 0) { print '<i>'; }
		print $r[1];
		if($r[5] eq 0) { print '</i>'; }
		print '</a></td>';
		my $timestr = time2str('%Y-%m-%d', $r[2], 'EST');
		my $count = $r[4] + 1; $tcount += $count;
		$tsize += $r[3];
		print "<td align=\"center\">$timestr</td>";
		print "<td align=\"center\">$r[3]</td>";

		my $link = "$site_url/insipid.cgi?op=snapshots&md5=$r[0]";

		if($count ne 1) {
			print "<td align=\"center\"><a href=\"$link\">$count</a></td>";
		} else {
			print "<td align=\"center\">$count</td>";
		}
		
		print '<td>';
		print "<a href=\"insipid.cgi?op=snapshots&delete=$r[0]\">delete</a>,";
		print " <a href=\"insipid.cgi?op=fetchrelated&id=$r[0]\">";
		print "fetch linked objects</a></td>";
		print '</tr>';
	}

	print '<tr><td><b>Total</b></td><td>&nbsp;</td>';
	print "<td align=\"center\"><b>$tsize</b></td>";
	print "<td align=\"center\"><b>$tcount</b></td><td>&nbsp;</td></tr>";
	
	print "</table></center>";
}

# This fetches all linked-to objects (specifically images for now)
# for a cached page.
sub fetch_related {
	my ($md5) = (@_);

	my $sql = "select content, url
		from $tbl_pagecache where (md5 = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($md5);

	my @r = $sth->fetchrow_array();

	my $p = Insipid::LinkExtractor->new($r[1]);
	$p->parse($r[0]);

}

# Deletes a snapshot and all orphan cache children, taking into
# account the fact that items can be shared across cached pages.
#
# This is horribly expensive, and someday I'll replace it with
# a much nicer function.
sub delete_snapshot {
	my ($md5) = (@_);
	
	# The snapshot
	my $sql = "delete from $tbl_pagecache where (md5 = ?)";
	my $delstatement = $dbh->prepare($sql);
	$delstatement->execute($md5);

	# References
	$sql = "delete from $tbl_pagecache_references where (md5_parent = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($md5);
	
	# Orpans - blow away any md5s in the pagecache table that aren't 
	# referenced as a child in the references table. First, get a list
	# of valid MD5s.
	$sql = "select distinct md5_child from $tbl_pagecache_references";
	$sth = $dbh->prepare($sql);
	$sth->execute();

	my $subquery = '';
	while(my @r = $sth->fetchrow_array) {
		if($subquery ne '') { $subquery = $subquery . ','; }
		$subquery = "$subquery '$r[0]'";
	}
	
	$sql = "select distinct md5_parent from $tbl_pagecache_references";
	$sth = $dbh->prepare($sql);
	$sth->execute();
	while(my @r = $sth->fetchrow_array) {
		if($subquery ne '') { $subquery = $subquery . ','; }
		$subquery = "$subquery '$r[0]'";
	}

	if($subquery eq '') {
		$sql = "delete from $tbl_pagecache;";
	} else {
		$sql = "delete from $tbl_pagecache where md5 not in ($subquery)";
	}
	
	$sth = $dbh->prepare($sql);
	$sth->execute();
}

sub do_snapshot {
	# Save the page.
	print '<br /><br />';
	
	my ($bookmark_id) = (@_);
	my $sql = "select url,md5,title from $tbl_bookmarks where (id = ?)";
        my $sth = $dbh->prepare($sql);
	$sth->execute($bookmark_id);
	my @row = $sth->fetchrow_array;

	if(@row) {
		print "<p>Fetching \"<b>$row[2]</b>\"...</p>\n";
		$referer = $row[0];
		fetch_url(@row);	
	} else {
		die "Couldn't find the row for id $bookmark_id!";
	}
}

sub parsepage {
	my ($url, $content, $content_type) = (@_);

	my $p = Insipid::Parser->new($url, \&fetch_url);
	if($content_type =~ /utf/i) { 
		$p->utf8_mode(1);
	}

	$p->parse($content);
}

1;
__END__
