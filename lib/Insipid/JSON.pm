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

package Insipid::JSON;

use strict;
use warnings;

use vars qw(@ISA @EXPORT @EXPORT_OK);
use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);
use Insipid::Config;
use Insipid::Database;
use Insipid::Sessions;
use Date::Format;
use Date::Parse;

require Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(
send_json_tags
send_json_posts
);

my $query = '';
my $last_page = 0;



sub send_json_tags {
	my ($sql, $sth);
	
	# Building up JSON structure before parsing the data:
	my ($json_prefix,$json_suffix);
	# limiting url_param('callback')  to a reasonable length (100): 
	if((defined(url_param('callback'))) && (length(url_param('callback')) < 100)){
		$json_prefix = ''.url_param('callback').'({';
		$json_suffix = '})';
		}  elsif(url_param('raw') eq 1) {
				$json_prefix = '{';
				$json_suffix = '}';
			} else {
					$json_prefix = 'if(typeof(Insipid) == \'undefined\') Insipid = {}; Insipid.tags = {';
					$json_suffix = '}';
				}
	#limiting tags count, only if url_param('count') is a valid integer:
	my $limit ;
	if (url_param('count') =~ /^[+-]?\d+$/) {
		$limit = ' limit '.url_param('count') ;
	}



	# If the user has already chosen a tag, get the intersection list
	if((url_param('tag')) && (logged_in() eq 1)) {
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
			group by $tbl_tags.name $limit";
		$sth = $dbh->prepare($sql);
		$sth->execute(url_param('tag'), url_param('tag'));
	print $json_prefix ;
	if($sth->rows ne 0) {
		my $icount = 1 ;
		while(my @r = $sth->fetchrow_array()) {
			json_show_tag($icount, $sth->rows, $r[0], $r[1]);
			$icount++ ;
		}
	}
	print $json_suffix ;	
	return ;
	} else {

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
		   $order_clause 
		   $limit";

	$sth = $dbh->prepare($sql);
	$sth->execute;
	print $json_prefix;
	if($sth->rows ne 0) {
		my $icount = 1;
		while(my @r = $sth->fetchrow_array()) {
			json_show_tag($icount, $sth->rows, $r[0], $r[1]);	
			$icount++;
		}
	}
	print $json_suffix;
	return;
	}
}

sub json_show_tag {
	my($icount, $rowscount, $tag, $tagcount) = (@_);
	$tag =~ s/\"/\\"/g ;
	my $json_txt = '';
	$json_txt = $json_txt.'"'.$tag.'":'.$tagcount;
	if ($icount ne $rowscount){
		$json_txt = $json_txt.',';
	}
	print $json_txt ;
}

sub send_json_posts {
	
	# Building up JSON structure before parsing the data:
	my ($json_prefix,$json_suffix);
	# limiting url_param('callback')  to a reasonable length: 
	if((defined(url_param('callback'))) && (length(url_param('callback')) < 100)){
		$json_prefix = ''.url_param('callback').'([';
		$json_suffix = '])';
		}  elsif(url_param('raw') eq 1) {
				$json_prefix = '[';
				$json_suffix = ']';
			} else {
					$json_prefix = 'if(typeof(Insipid) == \'undefined\') Insipid = {}; Insipid.posts = [';
					$json_suffix = ']';
				}
	#limiting posts count to  url_param('count') , setting hard limit to 100 and  default limit to 50 :
	my $limit ;
	if ((url_param('count') =~ /^[+-]?\d+$/) && (url_param('count') < 101)) {
		$limit = url_param('count') ;
	} else {
		$limit = 50 ;
	}
	
	my ($subquery, $sql, $sth, @parms, @wheres, @hr);

	# this first query will be used to select from a set, like when a user
	# drills in on a specific tag or to get a smaller view of the entire
	# dataset (for paging purposes).

	# MySQL and postgres have slightly different syntax here...
	if ($dbtype eq 'mysql') {
	    $sql = "select $tbl_bookmarks.id from $tbl_bookmarks";
	} elsif ($dbtype eq 'Pg') {
	    $sql = "select $tbl_bookmarks.id, $tbl_bookmarks.date
	    	from $tbl_bookmarks";
	}

	# Limit to tags
	if(defined(url_param('tag'))) {
	# Join the tag tables only when necessary

		if(url_param('tag') =~ / /) {
			my @tags = split(/ /, url_param('tag'));
			my $icount = 1;

			foreach(@tags) {
				push(@parms, $_);
				$sql = "$sql inner join $tbl_bookmark_tags
						as bt$icount on
					  ($tbl_bookmarks.id =
					  	bt$icount.bookmark_id)
					inner join $tbl_tags as t$icount on
					   (t$icount.id = bt$icount.tag_id
					   	and t$icount.name = ?) ";
				$icount++;
			}
		} else {
			$sql = "$sql
				left join $tbl_bookmark_tags on
				  ($tbl_bookmarks.id =
				  	$tbl_bookmark_tags.bookmark_id)
				inner join $tbl_tags on
			  	  ($tbl_tags.id = $tbl_bookmark_tags.tag_id)
				  where ($tbl_tags.name = ?)";
			push(@parms, url_param('tag'));
		}

	}

	# Search 
	# ?q=
	$query = url_param('q');
	if($query ne "") {
  		if((get_option("public_searches") eq "yes") || (logged_in() eq 1)) {
			my $sparm = $query;
			if(length($sparm) > 2) {
				$sql = "$sql where ($tbl_bookmarks.title like ?)";
				$sparm =~ s/\%//;
				$sparm = "\%$sparm\%";
				push(@parms, $sparm);
			}
		}
	}

	# order
	$sql = "$sql order by $tbl_bookmarks.date desc";

	# paging functionality
	$sql = "$sql limit $limit";
	
	
	if(url_param('page')) {
	    my $offset = ((url_param('page') - 1) * $limit);
	    $sql = "$sql offset $offset";
	}

	$sth = $dbh->prepare($sql);
	$sth->execute(@parms);

	$subquery = "";
	if($sth->rows > 0) {
		if($sth->rows ne $limit) { $last_page = 1; }

		$subquery = " $tbl_bookmarks.id in (";

		while(@hr = $sth->fetchrow_array) {
			$subquery = $subquery . "$hr[0],";
		}
		chop($subquery); # Strip off the last delimiter

		$subquery = $subquery . ")";
	} else {
		# no bookmarks found:
		###################
		print $json_prefix ;
		print $json_suffix ;
		###################
		return;
	}

	@parms = ();
	@wheres = ();

        $sql = "select
  		  $tbl_bookmarks.id,
		  $tbl_bookmarks.title,
		  $tbl_bookmarks.description,
		  $tbl_bookmarks.access_level,
		  $tbl_bookmarks.url,
		  $tbl_tags.name,
		  $tbl_bookmarks.date,
		  $tbl_pagecache.date as cache_date,
		  $tbl_bookmarks.md5
		from $tbl_bookmarks
		left join $tbl_bookmark_tags on
		  ($tbl_bookmarks.id = $tbl_bookmark_tags.bookmark_id)
		left join $tbl_tags on
		  ($tbl_tags.id = $tbl_bookmark_tags.tag_id)
		left join $tbl_pagecache on
		  ($tbl_bookmarks.md5 = $tbl_pagecache.md5)";

	# Don't show private marks for non-logged in users
	if(logged_in() eq 0) {
	  push(@wheres, "$tbl_bookmarks.access_level");
	  push(@parms, "1");
	}

	my $max = @wheres;
	if($max ne 0) {
	  $sql = "$sql where (";
	  my $count = 1;

  	  foreach (@wheres) {
	    $sql = "$sql $_ = ?";
	    if($count < $max) {
	      $sql = "$sql and ";
	    }
	    $count++;
	  }

	  $sql = "$sql )";
	  if($subquery ne "") { $sql = "$sql and $subquery"; }
	} else {
	  if($subquery ne "") { $sql = "$sql where $subquery "; }
	}

    # append sort order.
	$sql = "$sql order by $tbl_bookmarks.date desc";

	$sth = $dbh->prepare($sql);
        $sth->execute(@parms);

	my %last;
	$last{id} = -1;
	
	
	###################
	print $json_prefix ;
	###################
	
	while(@hr = $sth->fetchrow_array) {
		if($last{id} eq -1) {
		  $last{id} = $hr[0];
		  $last{title} = $hr[1];
		  $last{description} = $hr[2];
		  $last{access_level} = $hr[3];
		  $last{url} = $hr[4];
		  $last{tags} = "";
		  $last{timestamp} = $hr[6];
		}

		if($hr[0] ne $last{id}) {
		  # the id changed, so show the last mark.
		  json_show_post(0,$last{id}, $last{title}, $last{description}, $last{access_level}, $last{url}, $last{tags}, $last{timestamp});

		  # Swap the new one in.
		  $last{id} = $hr[0];
		  $last{title} = $hr[1];
		  $last{description} = $hr[2];
		  $last{access_level} = $hr[3];
		  $last{url} = $hr[4];
		  $last{tags} = $hr[5];
		  $last{timestamp} = $hr[6];
		} else {
		  # Add tag to the current bookmark
		  if(defined($hr[5])) {
		    $last{tags} = "$last{tags} $hr[5]";
		  }
		}
	}

	if($last{id} ne -1) {
		json_show_post(1,$last{id}, $last{title}, $last{description}, $last{access_level}, $last{url}, $last{tags}, $last{timestamp});
	}

	###################
	print $json_suffix ;
	###################
}


sub json_show_post {
	my($last_mark, $id, $title, $description, $access_level, $url,
		$tags, $timestamp) = (@_);
	$title =~ s/\"/\\"/g ;
	$description =~ s/\"/\\"/g ;
	$tags =~ s/\"/\\"/g ;
	my $json_txt = '{';
	
	if($access_level eq 0) {
		$json_txt = $json_txt.'"u":"'.$site_url.'/insipid.cgi?go='.$id.'",';
		$json_txt = $json_txt.'"d":"'.$title.'",';
	} else {
		$json_txt = $json_txt.'"u":"'.$url.'",';
		$json_txt = $json_txt.'"d":"'.$title.'",';
	}

	if($description){
		$json_txt = $json_txt.'"n":"'.$description.'",';
	}
	
	my $timestr = '';
	if(logged_in() eq 1) {
		$timestr = time2str('%Y-%m-%d %T EST', $timestamp, 'EST');
	} else {
		$timestr = time2str('%Y-%m-%d', $timestamp, 'EST');
	}

	$json_txt = $json_txt.'"dt":"'.$timestr.'"';

	if($tags) {
		$json_txt = $json_txt.',"t":[';
		my $cur;
		my @tags = split(/\ /, $tags);
		my $icount = 1 ;
		foreach my $tag (@tags) {
			if($tag){
				$json_txt = $json_txt.'"'.$tag.'"';
					if ($icount ne @tags){
						$json_txt = $json_txt.',';
					}
			}
		$icount++ ;
		}
		$json_txt = $json_txt.']';  
	}
	
	$json_txt = $json_txt.'}';
	
	if($last_mark ne 1){
		$json_txt = $json_txt.','; 
	}
	
	print $json_txt ;
}
1;
__END__
