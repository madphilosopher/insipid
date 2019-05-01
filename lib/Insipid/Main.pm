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

package Insipid::Main;

use warnings;
use strict;

use vars qw(@ISA @EXPORT @EXPORT_OK);
require Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(main);

use Insipid::Config;
use Insipid::Database;
use Insipid::Bookmarks;
use Insipid::RSS;
use Insipid::JSON;
use Insipid::Sessions;
use Insipid::Snapshots;
use Insipid::Tags;
use Insipid::Util;

use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);
use URI::Escape;
use IO::File;
#use XML::Parser;
use XML::Writer;
use Date::Format;
use Date::Parse;
use DBI qw/:sql_types/;;
use Digest::MD5 qw(md5 md5_hex);
use MIME::Base64;
use LWP::UserAgent;
use HTTP::Request;
use HTTP::Response;

my $NL = "<br />\n";
my @valid;
my $icount = 0;
my %options;
my $tspec = "";
my $query = "";
my $last_page = 0;
my $site_title;

if(!defined($ENV{SERVER_NAME})) {
	$NL = "\n";
}

sub main {

	my $username = getconfig('username');
	my $userpass = getconfig('userpass');

	my $redirect = '';
	my $et = '';

	# Valid options:
	@valid = ('feed_name', 'site_name', 'public_searches',
			'use_rewrite', 'proxy_host', 'proxy_port');

	# Get the basic options
	$site_title = get_option('site_name');
	if($site_title eq '') {
		$site_title = 'Insipid Bookmarks';
	}

	# Initialize variables that can be posted and in the URL.
	if(defined(url_param('q'))) {
		$query = url_param('q');
	}

	if(defined(param('q'))) {
		$query = param('q');
	}

	# Check to see if a username and password have been posted
	if(defined(param('password')) && defined(param('username'))) {
	  if( (param('password') eq $userpass) && (param('username') eq $username) ) {
	    my $rv = login();
	    print $rv;
	  } else {
	    push(@errors, "Invalid username or password.");
	  }
	}

	# Operations for non-HTML content

	if(defined(url_param('op'))) {
		if(url_param('op') eq 'export') {
			my $sn = 'n';
			if(defined(param('snapshots'))) {
				$sn = 'y';
			}

			do_export($sn);
		}
	
		if(defined(param('op'))) {
			if(logged_in() eq 1) {
				if(param('op') eq 'logout') {
					my $rv = logout();
					print $rv;
				}
			}
		}

	  # RSS
	  if(url_param('op') eq 'rss') {
	    print "Content-Type: text/xml\r\n\r\n";
	    send_rss();
	    exit;
	  }
	  
	  # JSON
	  # JSON Show tags:
	  if(url_param('op') eq 'json_tags') {
	    print "Content-Type: application/x-javascript;charset=UTF-8\r\n\r\n";
		send_json_tags();
	    exit;
	  }
	  # JSON Show bookmarks:
	  if(url_param('op') eq 'json_posts') {
	    print "Content-Type: application/x-javascript;charset=UTF-8\r\n\r\n";
	    send_json_posts();
	    exit;
	  }
	  
	  # Cache
	  if(url_param('op') eq 'viewsnapshot') {
	    check_access();
	    if(param('md5')) {
		show_snapshot(param('md5'));
	    }
	  }
	}

	# Allow redirections to a bookmark if the user's logged in.
	# This allows private bookmarks to not send a referer.
	if(logged_in() eq 1) {
	  if(param('go')) {
	    my $bid = param('go');
	    my $sql = "select url from $tbl_bookmarks
			 where ($tbl_bookmarks.id = ?)";
	    my $sth = $dbh->prepare($sql);
	    $sth->execute($bid);
	    my $hr = $sth->fetchrow_hashref;
	    if(defined($hr->{'url'})) {
	      print "Cache-Control: private, must-revalidate\n";
	      print "Content-Type: text/html; charset=UTF-8\n\n";
	      print "<META HTTP-EQUIV=Refresh CONTENT=\"0; URL=$hr->{'url'}\">\n";
	      exit;
	    } else {
	      push(@errors, "Bookmark does not exist.");
	    }
	  }
	}

	# Add description to the HTML title tag.
	if(url_param('tag')) {
		$tspec = "/" . url_param('tag');
		$tspec =~ s/ /\+/g;
		my $tt = url_param('tag');
		$tt =~ s/ / \+ /g;
		$et = sprintf(" - %s", $tt);
	}
	if($query ne "") {
		$et = sprintf(" - search results for \"%s\"", $query);
	}

	if(logged_in() eq 1) {
	  print "Cache-Control: private, must-revalidate\n";
	}

	print "Content-Type: text/html; charset=UTF-8\n\n";


	print <<DOC;
	<html>
	  <head>
	    <title>$site_title$et</title>
	    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	    <link rel="alternate" type="application/rss+xml" title="RSS" href="$feed_url$tspec" />
	    <link rel="stylesheet" href="$site_url/insipid.css" type="text/css" title="Standard" />
        <link rel="shortcut icon" href="/favicon.ico" />
	  </head>
	  <body marginheight="0" marginwidth="0">
DOC


	###### Operations that don't touch the screen
	if(defined(param('op')) && defined(param('id'))) {
	  if(param('op') eq 'delete_bookmark') {
	    my $id = param('id');
	    delete_bookmark($id);
	  } 
	}


	# If the user just saved a bookmark, redirect them now.
	if($redirect ne "") {
	  print "<script language=\"JavaScript\">document.location = \"$redirect\";</script>";
	  print "</body></html>";
	  exit;
	}

	show_toolbar();
	show_tags();

	print '<table class="bodyContent" border="0"><tr><td>';

	if(defined(url_param('op'))) {
	  if(url_param('op') eq 'export') {
	  	if(!defined(param('target'))) {
		    	print "<br /><br /><form method=\"post\" class=\"formText\">";
			print "<input type=\"checkbox\" name=\"snapshots\" />Include Snapshots<br />";
			print "<input type=\"submit\" value=\"Export\" /></form>";
		}
	  }
	  
	  if(url_param('op') eq 'import') {
	    check_access();
	    if(param('fileupload')) {
	      do_import();
	    } else {
	      print <<IFORM;
	<p>This allows you to import either 
	<a href="https://github.com/LReeves/insipid">Insipid</a> or 
	<a href="http://del.icio.us/">del.icio.us</a> backups.  For del.icio.us, you
	must first use their API to export your bookmarks to an XML file.  To do this,
	access the URL "http://username:password\@del.icio.us/api/posts/all?" 
	(using your username and password).  You can then upload that XML file here.
	</p>
	<br />
	<form class="formtext" enctype="multipart/form-data" action="$site_url/insipid.cgi?op=import" method="post">
	Import from:<br />
	<input type="file" name="fileupload" size="30"><br />
	<input type="hidden" name="op" value="import" />
	<input type="submit" value="Import" />
	</form>
IFORM
	    }
	  }
	}

	if(defined(param('op'))) {
	  if(param('op') eq 'login') {
	      login_form();
	  } 

	  if((param('op') eq 'add_bookmark') || (param('op') eq 'edit_bookmark') ) {
	    #check to see if the url is bookmarked, then indicate that this is an edit.
	    my ($id, $url, $title, $description, $button, 
		$tags, $extra_params, $access_level, $access_box) =
	       (-1, "", "", "", "",  "", "", 0, "");

	    $access_level = 0;
	  
	    if(defined(param('save'))) {
	      ($url, $title, $description, $tags) = 
		(param('url'), param('title'), param('description'), param('tags'));

	      if(defined(param('access_level'))) {
		if(param('access_level') eq 'on') {
		  $access_level = 1;
		} else {
		  $access_level = 0;
		}
	      }
		
	      if(param('id')) {
		update_bookmark(param('id'), $url, $title, $description, $access_level, $tags);
	      } else {
		add_bookmark($url, $title, $description, $access_level, 0, $tags);
		if(param('snapshot')) {
		  if(param('snapshot') eq 'on') {
		    $id = get_bookmark_id(param('url'));
		    do_snapshot($id);
		  }
		}
	      }

	      if(param('redirect')) {
		if(param('redirect') eq 'on') {
		  if(@errors eq 0) {
		    $redirect = $url;
		  }
		}
	      }
	    } else {
	      # Show the form, populating from the database if it's an existing entry.
	      my $utext = "URL:";
	      my $snapshot_params = "";
	      $id = "-1";

	      if(defined(param('id'))) { $id = param('id'); }
	      if(defined(url_param('id'))) { $id = url_param('id'); }

	      if($id eq "-1") { 
	      	if(defined(param('url'))) {
		  $id = get_bookmark_id(param('url')); 
		}
	      }
	    
	      if($id ne -1)  {
		($url, $title, $description, $access_level) = get_bookmark($id);
		$tags = get_tags($url);
		$button = "Save";
		$utext = "<span style=\"color:red\">URL (already bookmarked):</span>";
		$extra_params = "<input type=\"hidden\" name=\"id\" value=\"$id\" />";
	      } else {
		# There has to be a nicer way to do this.
		if(param('url'))	 { $url = param('url'); }
		if(param('title'))	 { $title = param('title'); }
		if(param('description')) { $description = param('description'); }
		$access_level = 1;
		$button = "Add";
		$snapshot_params = "<span class=\"formtext\">Snapshot:</span><input type=\"checkbox\" name=\"snapshot\" />\n";
	      }
	  
	      my $style = "style=\"width:500px\"";
	      my $redir = "off";
	      my $redir_box = "";
	      
	      if(param('redirect')) {
		      if(param('redirect') eq 'on') { $redir = 'on'; }
		      if(param('redirect') eq 'true') { $redir = 'on'; }
	      }

	      if($access_level eq 0) { $access_box = ""; } 
	      else { $access_box = "checked=\"true\" "; }
	      
	      if($redir eq 'on') { $redir_box = "checked=\"true\""; } 

	      print <<FORM;
	      <br />
	      <form method="post">
	      <span class="formtext">$utext</span><br />
	      <input name="url" $style value="$url" /><br />
	      <span class="formtext">Title:</span><br />
	      <input name="title" $style value="$title" /><br />
	      <span class="formtext">Description:</span><br />
	      <input name="description" $style value="$description" /><br />
	      <span class="formtext">Tags:</span><br />
	      <input name="tags" $style value="$tags" /><br />
	      $snapshot_params
	      <span class="formtext">Public:</span>
	      <input type="checkbox" name="access_level" $access_box />
	      <span class="formtext">Return:</span>
	      <input type="checkbox" name="redirect" $redir_box />
	      <input type="hidden" name="save" value="true" />
	      <input type="hidden" name="op" value="add_bookmark" />
	      $extra_params
	      <input type="submit" value="$button" />
	      </form>
FORM
	    }
	  }
	}

	# Late redirects.  TODO: Get rid of this.
	if($redirect ne "") {
	  print "<script language=\"JavaScript\">document.location = \"$redirect\";</script>";
	  print "</body></html>";
	  exit;
	}


	if(defined(param('op'))) {
	  if(logged_in() eq 1) {
	    if(param('op') eq 'fetchrelated') {
	    	if(defined(param('id'))) {
			fetch_related(param('id'));
		}
	    }

	    if(param('op') eq 'snapshots') {
	      show_snapshots();
	      print "</body></html>";
	      exit;
	    }

	    if(param('op') eq 'snapshot') {
	      if(defined(param('id'))) {
		do_snapshot(param('id'));
		print "</body></html>";
		exit;
	      }
	    }

	    if(param('op') eq 'bookmarklets') {
	      print <<DESC;
<p>This bookmarklet provides a fast way to add your browser's 
current page to this Insipid installation.  Either drag the 
following link to your bookmarks toolbar or right-click on it 
and choose "Bookmark This Link..." to create a bookmarklet.  
Then when you're on a page you'd like to save, click on your 
new "Add to Insipid" button and you'll be brought to a page 
that allows you to fill out the tags for the bookmark and save 
it.  Once you've clicked Save you'll be brought back to the 
page.</p>
DESC
	      my $ad = <<BLET;
	javascript:location.href='$site_url/insipid.cgi?op=add_bookmark&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)+'&redirect=true'
BLET
	      print "<ul><li><a href=\"$ad\">Add to Insipid</a></li></ul>";
	      print "</body></html>";
	      exit;
	    }

	    # Configuration and management pages
	    if(param('op') eq 'tags') {
	      tag_operations();
	      print '</body></html>';
	      exit;
	    }

	    if(param('op') eq 'options') {
	      show_options();
	      print '</body></html>';
	      exit;
	    }
	  }
	}

	foreach (@errors) {
	  print "<div class=\"error\">$_</div>";
	}

	show_bookmarks();

	print "</td></tr></table><br /></body></html>";
} # main



################################################################

sub show_options {
	# Save options if they were posted.
	print "<br /><br />";
	if(param('save')) {
		my $sql = "update $tbl_options set value=? 
			where (name = ?)";
		my $sth = $dbh->prepare($sql);

		my %save;
		foreach my $p (@valid) {
			if(param($p)) {
				$save{$p} = param($p);
			}
		}

		foreach my $k (keys %save) {
			$sth->execute($save{$k}, $k);
		}

		# The proxy_host can be empty, so check for that.
		if(!defined($save{'proxy_host'})) {
			$sth->execute('', 'proxy_host');
		}

		print "<div class=\"error\">Your options have been saved.</div>";
	}

	# Now show em
	my $sql = "select name, description, value from $tbl_options";
	my $sth = $dbh->prepare($sql);
	$sth->execute();

	print "<form method=\"post\">";
	print "<table id=\"options\" cellpadding=5 cellspacing=5>";
	while(my $hr = $sth->fetchrow_hashref) {
		print "<td>$hr->{'description'}</td>";
		if($hr->{'name'} eq 'version') {
			print "<td>$hr->{'value'}</td>";
		} else {
			print "<td><input name=\"$hr->{'name'}\" value=\"$hr->{'value'}\" /></td>";
		}
		print "</tr>";
	}

	print "<input type=hidden name=op value=options>";
	print "<input type=hidden name=save value=yes>";
	print "<tr><td></td><td><input type='submit' value='Save'></td></tr>";
	print "</table></form>";
}

sub show_footer {
	my $older = 2;
	if(defined(url_param('page'))) {
		$older = url_param('page') + 1;
	}
	
	if($last_page eq 0) { 
	  if($query ne "") {
	    print " | <a href=\"?page=$older&q=";
	    print $query;
	    print "\">More Results</a>";
	  } else {
	    print " | <a href=\"?page=$older\">older</a>"; 
	  }
	}
}

sub do_import {
	my $old_fh = select(OUTPUT_HANDLE);
	my $cbuffer = ""; my $pcount = 0;
	$| = 1;
	select($old_fh);

	my ($omd5, $ourl, $otype, $olength, $odate, $sql, 
       		$oadd, $omod, $otags);
	my $ispec = '';

	if($dbtype eq 'mysql') { $ispec = " ignore "; }
	
	$sql = "insert $ispec into pagecache_references
			(md5_parent, md5_child) values(?,?)";
	my $insert_reference = $dbh->prepare($sql);

	$sql = "insert $ispec into pagecache
			(md5,url,content_type,
			content_length,content,date)
			values(?,?,?,?,?,?)";
	my $insert_snapshot = $dbh->prepare($sql);

	$sql = 'update options set value = ? where (name = ?)';
	my $update_option = $dbh->prepare($sql);

	my $parser = new XML::Parser();
	$parser->setHandlers(Start => sub {
		my %attr;
		my $expat = shift;
		my $element = shift;

		while(@_) {
			my $att = shift;
			my $val = shift;
			$attr{$att} = $val;
		}

        	# netscape stuff
	        if ( $element eq "A" ) {
        	    $ourl = $attr{'HREF'};
	            $oadd = $attr{'ADD_DATE'};
        	    $omod = $attr{'LAST_MODIFIED'};
	            $otags = $attr{'TAGS'};
        	    $cbuffer = '';
	        }
       
		# A pagecache object
		if($element eq "object") {
			$omd5 = $attr{'md5'};
			$ourl = $attr{'url'};
			$otype = $attr{'type'};
			$olength = $attr{'length'};
			$odate = $attr{'date'};
		}

		# A pagecache relationship
		if($element eq "relationship") {
			my $parent = $attr{parent};
			my $child = $attr{child};
			$insert_reference->execute($parent, $child);
		}
		
		# A bookmark
		if($element eq "post") {
			my $url = $attr{href};
			my $title = $attr{description};
			my $tagvalue = $attr{tag};
			my $datevalue = $attr{time};
			my $access_level;
			if(defined($attr{access_level})) {
				$access_level = $attr{access_level};
			} else {
				$access_level = 1;
			}

			my $epoch = str2time($datevalue);

			if($tagvalue eq "system:unfiled") {
				$tagvalue = "";
			}

			add_bookmark($url, $title, "", $access_level,
				$epoch, $tagvalue, 1);
		}

		# Option
		if($element eq 'option') {
			$update_option->execute(
				$attr{value}, $attr{name});
		}
	}, Char => sub {
		my $expat = shift;
		my $chars = shift;
		$cbuffer = $cbuffer . $chars;
		1;
	}, End => sub {
		my $expat = shift;
		my $element = shift;
    
        #
        # netscape stuff
        #
        if($element eq 'A') {
            add_bookmark(
                $ourl,                # $url, 
                $cbuffer,             # $title, 
                "",
                '1',                  # $access_level,
                $omod,                # $epoch, 
                $otags,               # $tagvalue
            );
            $cbuffer = '';
        }
        if ( $element eq 'TITLE' || $element eq 'H1' || $element eq 'DD') {
            $cbuffer = '';
        }
        
		if($element eq 'object') {

			$insert_snapshot->bind_param(1, $omd5);
			$insert_snapshot->bind_param(2, $ourl);
			$insert_snapshot->bind_param(3, $otype);
			$insert_snapshot->bind_param(4, $olength);
			
			if($dbtype eq "Pg") {
				$insert_snapshot->bind_param(5, 
					decode_base64($cbuffer), SQL_VARBINARY);
			} else {
				$insert_snapshot->bind_param(5, 
					decode_base64($cbuffer));
			}

			$insert_snapshot->bind_param(6, $odate);
			$insert_snapshot->execute;
			
			if(!defined($DBI::errstr)) { $pcount++; }

			$cbuffer = "";
		}
	});

	my $xml = "";

#	BEGIN {
#	  *CORE::GLOBAL::die = sub {
#	    print "Some errors were detected. ";
#	  };
#	}

	if(defined($ENV{SERVER_NAME})) {
		my $fh = upload('fileupload');
		while(<$fh>) {
			$xml .= $_;
		}
	
		$parser->parse($xml);
	} else {
		if(!defined($ARGV[0])) {
			print "Please specify the filename to import.\n\n";
			exit;
		}
	
		my $fn = $ARGV[0];
		$parser->parsefile($fn);
	}
	
	print "Import finished - $icount bookmarks and $pcount " .
			"snapshot objects imported.$NL";
}

sub do_export {
	my ($snapshots, $islocal) = (@_);
	my $writer;
	
	if(!defined($islocal)) {
		print "Content-Type: text/xml;charset=UTF-8\r\n";
		print "Content-Disposition: attachment; filename=bookmarks.xml\r\n\r\n";
	}

	$writer = new XML::Writer();

	$writer->xmlDecl('UTF-8');
	$writer->startTag('insipid');

	export_bookmarks($writer);
	export_snapshots($writer);
	export_options($writer);
	
	$writer->endTag('insipid');
	$writer->end();
	exit;
}

sub login_form {
      print <<FORM;
<br />
<form method="post" action="$site_url/insipid.cgi">
<span class="formtext">Username:</span><br />
<input style="width:250px" name="username" /><br />
<span class="formtext">Password:</span><br />
<input style="width:250px" name="password" type="password" /><br />
<input type="submit" value="Login" />
</form>
<br />
FORM
}


sub show_toolbar {
	my $rdata = "";
	if(defined(url_param('tag'))) {
		$rdata = url_param('tag');
		$rdata =~ s/ /\+/g;
	}

	# Toolbar
	print '<center>';
	print '<table border="0" width="100%" cellspacing="0" cellpadding="3"><tr>';
	print '<td valign="top" bgcolor="#CCCCCC">';

	# Title
	print '<div class="title"><a href="';
	if(get_option('use_rewrite') eq 'yes') {
  		print $site_url . '/bookmarks';
	} else {
  		print 'insipid.cgi';
	}
	print '">' . $site_title . '</a></div>';
  
	if((get_option("public_searches") eq "yes") || (logged_in() eq 1)) {
		print "<div class=\"search\">";
		print "<form action=\"$site_url/bookmarks\" method=\"post\">";
		print "<input type=\"text\" name=\"q\"> <input type=\"submit\" value=\"search\">";
		print "</form>";
		print "</div>";
	} else {
		print "&nbsp;";
	}
    
	print "</td><td valign=\"top\" bgcolor=\"#CCCCCC\" align=\"right\">";
	print "<div class=\"toolbar\">";
  
	if(logged_in() eq 1) {
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=options\">options</a> | "; 
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=tags\">tags</a> | ";
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=import\">import</a> | ";
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=export\">export</a> | ";
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=snapshots\">snapshots</a> | ";
	   	print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=logout\">logout</a><br />";
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=add_bookmark\">add</a> | ";
		print "<a class=\"tools\" href=\"$site_url/insipid.cgi?op=bookmarklets\">bookmarklets</a> | ";
	}

	my $rf;
	if(get_option('use_rewrite') eq 'yes') {
		$rf = $feed_url . '/' . $rdata;
	} else {
		$rf = $feed_url . $rdata;
	}
	
	print "<a class=\"tools\" href=\"$rf\">RSS feed</a>";

	if(logged_in() ne 1) {
		print " | <a class=\"tools\" href=\"$site_url/insipid.cgi?op=login\">login</a>";
	}

	print " | <a class=\"tools\" href=\"javascript:void window.open('$site_url/help.html','width=300,height=500');\">help</a> ";
	print " | <a class=\"tools\" href=\"https://github.com/LReeves/insipid\">source</a>";

	print "</div></tr></table></center>";
}

sub delete_bookmark {
	my($id) = (@_);
	my($sql, $sth, $md5) = ("", "", "");

	if(logged_in() ne 1) {
	  push(@errors, "You have to be logged in to perform that operation.");
	  return;
	}

	# Check for cached version to delete.
	$sql = "select $tbl_pagecache.md5 from $tbl_pagecache 
		inner join $tbl_bookmarks on 
		($tbl_pagecache.md5 = $tbl_bookmarks.md5) 
		where ($tbl_bookmarks.id = ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute($id);
	while(my @r = $sth->fetchrow_array) {
		$md5 = $r[0];
	}

	# Drop the tags for the bookmark
	$sql = "delete from $tbl_bookmark_tags where (bookmark_id = ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute($id);
	
	# Drop the bookmark.
	$sql = "delete from $tbl_bookmarks where (id = ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute($id);

	# Delete the cached page.
	if($md5 ne "") { delete_snapshot($md5); }
}

sub show_bookmarks {
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
	$sql = "$sql limit 100";
	
	if(defined(url_param('page'))) {
	    my $offset = ((url_param('page') - 1) * 100);
	    $sql = "$sql offset $offset";
	}

	$sth = $dbh->prepare($sql);
	$sth->execute(@parms);

	$subquery = "";
	if($sth->rows > 0) {
		if($sth->rows ne 100) { $last_page = 1; }
	
		$subquery = " $tbl_bookmarks.id in (";
		
		while(@hr = $sth->fetchrow_array) {
			$subquery = $subquery . "$hr[0],";
		}
		chop($subquery); # Strip off the last delimiter
		
		$subquery = $subquery . ")";
	} else {
		print "<p>No bookmarks found.</p>";
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

	print '<ul><br />';

	my $title = '';
	if(defined(url_param('tag'))) {
		my $temp = url_param('tag');
		if($temp =~ / /) {
			my $count = 0;
			foreach(split(/ /, $temp)) {
				if($count++ ne 0) { $title = "$title +"; }
				$title = "$title <a class=\"bodyTitle\" href=\"$tag_url$_\">$_</a>";
			}
		} else {
			$title = "<a class=\"bodyTitle\" href=\"$tag_url$temp\">$temp</a>";
		}
	} else {
		$title = 'Most Recent Bookmarks';
	}

	if($query ne '') { 
		$title = sprintf("Search results for \"%s\"", $query); 
	}
	  
	print "<span class=\"bodyTitle\">$title</span>";
	show_footer();
	print '<br /><br />';

	print "<table class=\"bookmarklist\">";
	print '<tr><td>';
	print "<ul type=\"circle\">\n";
	while(@hr = $sth->fetchrow_array) {
		if($last{id} eq -1) {
		  $last{id} = $hr[0];
		  $last{title} = $hr[1];
		  $last{description} = $hr[2];
		  $last{access_level} = $hr[3];
		  $last{url} = $hr[4];
		  $last{tags} = "";
		  $last{timestamp} = $hr[6];
		  $last{cachetime} = $hr[7];
		  $last{md5} = $hr[8];
		} 
		
		if($hr[0] ne $last{id}) {
		  # the id changed, so show the last mark.
		  show_bookmark($last{id}, $last{title}, $last{description}, $last{access_level}, $last{url}, $last{tags}, $last{timestamp}, $last{cachetime}, $last{md5});	

		  # Swap the new one in.
		  $last{id} = $hr[0];
		  $last{title} = $hr[1];
		  $last{description} = $hr[2];
		  $last{access_level} = $hr[3];
		  $last{url} = $hr[4];
		  $last{tags} = $hr[5];
		  $last{timestamp} = $hr[6];
		  $last{cachetime} = $hr[7];
		  $last{md5} = $hr[8];
		} else {
		  # Add tag to the current bookmark
		  if(defined($hr[5])) {
		    $last{tags} = "$last{tags} $hr[5]";
		  }
		}
	}

	if($last{id} ne -1) {
		show_bookmark($last{id}, $last{title}, $last{description}, $last{access_level}, $last{url}, $last{tags}, $last{timestamp}, $last{cachetime}, $last{md5});
	}

	print "</ul></td></tr></table>";
}

sub show_bookmark {
	my($id, $title, $description, $access_level, $url, 
		$tags, $timestamp, $cachetime, $md5) = (@_);

	print "<div class=\"bookmarklistitem\">";
	print "<li>";
	if($access_level eq 0) { 
		print "<a href=\"$site_url/insipid.cgi?go=$id\">";
		print "<i>";
		print "$title";
		print "</i>";
	} else {
		print "<a href=\"$url\">";
		print $title;
	}

	if(logged_in() eq 1) {
		if(defined($cachetime)) {
			print "</a> - <a href=\"$snapshot_url$md5\">view snapshot";
	  	}
	}
	
	print "</a><br /><div class=\"bookmarkOperations\">";

	
	my $timestr = "";
	if(logged_in() eq 1) {
		#$timestr = time2str("%Y-%m-%d %T UTC", $timestamp, "UTC");
		$timestr = time2str("%Y %b %e", $timestamp, "UTC");
	} else {
		$timestr = time2str("%Y %b %e", $timestamp, "UTC");
	}

	#print "posted on $timestr ";
	print "$timestr";
	    
	if(defined($tags)) {
	  print ": ";
	  my $cur;
	    
	  foreach $cur (split(/\ /, $tags)) {
	    print '<a class="bookmarkTag" href="';
	    print $tag_url . $cur . '">' . $cur . '</a> ';
	  }
	}

	if(logged_in() eq 1) {
	  	my $ex = "";

	  	if(url_param('tag')) { $ex = "$ex&tag=" . url_param('tag'); }
	  	if(url_param('page')) { $ex = "$ex&page=" . url_param('page'); }
	  	if($query ne "") { $ex = "$ex&q=" . $query; }
	  
	  	print "<span class=\"bodytext\">&nbsp;&mdash;&nbsp;";
		print "(<a class=\"bookmarkOp\" href=\"$site_url/insipid.cgi?op=delete_bookmark&id=$id$ex\">delete</a>,&nbsp;";
		print "<a class=\"bookmarkOp\" href=\"$site_url/insipid.cgi?op=edit_bookmark&id=$id$ex\">edit</a>";
		if(!defined($cachetime)) {
	  		print ",&nbsp;<a class=\"bookmarkOp\" href=\"$site_url/insipid.cgi?op=snapshot&id=$id$ex\">snapshot</a>";
	  	}
		print ")<div class=\"bookmarkDescription\">$description</div></span></div></li>\n";
	}
	
	print "</div>\n";
}

# Gets the ID for a bookmark if it already exists in the DB. Otherwise, -1.
sub get_bookmark_id {
	my ($url) = (@_);
	
	# Lookup the URL id first.
	my $sql = "select $tbl_bookmarks.id from 
		$tbl_bookmarks where ($tbl_bookmarks.md5 = ?)";
	my $sth = $dbh->prepare($sql);

	$sth->execute(md5_hex($url));

	if($sth->rows ne 0) {
		my @r = $sth->fetchrow_array;
		return $r[0];
	}
	
	return -1;
}

sub get_bookmark {
	my ($id) = (@_);

	my $sql = "select 
			$tbl_bookmarks.title, 
			$tbl_bookmarks.description, 
			$tbl_bookmarks.url,
			$tbl_bookmarks.access_level 
			from $tbl_bookmarks 
			where ($tbl_bookmarks.id = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($id);
	my @r = $sth->fetchrow_array;
	return ($r[2], $r[0], $r[1], $r[3]);
}

sub update_bookmark {
	my ($id, $url, $title, $description, $access_level, $tags) = (@_);

	if(logged_in() ne 1) {
	  push(@errors, "You have to be logged in to perform that operation.");
	  return;
	}
	
	my $sql = "update $tbl_bookmarks 
			set url = ?, md5 = ?, title = ?, description = ?, 
			access_level = ? where (id = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($url, md5_hex("$url"), $title, $description, 
			$access_level, $id);

	set_tags($id, $tags);
}

1;
__END__
