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

package Insipid::Database;

use strict;
use warnings;

use Insipid::Config;
use Insipid::Schemas;

use DBI qw/:sql_types/;;
use vars qw($version);

use Exporter ();
our (@ISA, @EXPORT);
	
@ISA = qw(Exporter);
@EXPORT = qw($dbname $dbuser $dbpass $dsn $dbh $dbtype get_option 
	install $version $tag_url $feed_url $full_url $snapshot_url
	export_options $dbprefix);
	
our ($dsn, $dbh, $dbname, $dbuser, $dbpass, $snapshot_url,
	$dbtype, $tag_url, $feed_url, $full_url, $dbprefix);

$dbname = getconfig('dbname');
$dbuser = getconfig('dbuser');
$dbpass = getconfig('dbpass');

if(defined(getconfig('dbtype'))) {
	$dbtype = getconfig('dbtype');
} else {
	$dbtype = 'mysql';
}

$dsn = "DBI:$dbtype:dbname=$dbname;host=localhost";
$dbh = DBI->connect($dsn, $dbuser, $dbpass, { 'RaiseError' => 0}) or die $DBI::errstr;

my %options;

my $sql = "select name, value from $tbl_options";
my $sth = $dbh->prepare($sql);
$sth->execute() or die $DBI::errstr;

while(my $hr = $sth->fetchrow_hashref) {
	$options{$hr->{'name'}} = $hr->{'value'};
}

if(need_upgrade() eq 1) {
	dbupgrade();
}

sub export_options {
	my ($writer) = (@_);
	my ($sth);
	
	$writer->startTag('options');
	$sth = $dbh->prepare("select name, value from $tbl_options");
	$sth->execute();
	while(my $row = $sth->fetchrow_hashref) {
		if($row->{name} ne 'version') {
			$writer->emptyTag('option', 
				'name' => $row->{name},
				'value' => $row->{value});
		}
	}
	
	$writer->endTag('options');
}

sub dbupgrade {
	print STDERR "Upgrading Insipid database...\n";

	my $sql = "update $tbl_options set value = ? where (name = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($version, 'version');

	$sql = "insert into $tbl_options(name, value, description) 
			values(?, ?, ?)";
	$sth = $dbh->prepare($sql);
	$sth->execute('version', $version, 'Internal Insipid version');
	$sth->execute('use_rewrite', 'yes', 'Use mod_rewrite - disable this if you do not want to use mod_rewrite.');

	# Delete the old sessions table
	$sql = 'drop table sessions';
	$sth = $dbh->prepare($sql);
	$sth->execute();

	# Create the new session table if it's not there.
	$sql = "create table $tbl_authentication (
			session_id varchar(32),
			create_time int,
			primary key(session_id))";
	$sth = $dbh->prepare($sql);
	$sth->execute();
	if($dbh->errstr) {
		print STDERR $dbh->errstr;
	}
	
	return;
}

# Check if we need an upgrade
sub need_upgrade {
	if(!defined($options{version})) { return 1; }

	if($options{version} ne $version) {
		return 1;
	} else {
		return 0;
	}
}

# Functions

sub get_option {
	my ($name) = (@_);
	return $options{$name};
}

sub install {
	my ($sth, @creates);
	
	print "Content-Type: text/html\r\n\r\n";
	print "<html><head><title>Insipid Installation</title></head><body>";

	print "<p>Creating tables...";

	if($dbtype eq 'mysql') {
		@creates = split(/\;/, $createMySQL);
	} else {
		@creates = split(/\;/, $createPostgres);
	}

	foreach(@creates) {
		my $sql = $_;
		if(length($sql) > 2) {
			$sth = $dbh->prepare($sql);
			$sth->execute() or print "<br />Error executing \"$sql\" - $DBI::errstr<br />";
		}
	}
	print " done!</p>";

	print "<p>Insipid's database has been installed.  You can reload this " .
		"page to start using Insipid.</p>";
	
	print "</body></html>";

}

# This configures the URLs in the application to support mod_rewrite or
# a webserver sans mod_rewrite.
if(get_option('use_rewrite') eq 'yes') {
	$tag_url  	= $site_url . '/bookmarks/';
	$feed_url 	= $site_url . '/feeds/bookmarks';
	$full_url 	= $site_url . '/bookmarks';
	$snapshot_url	= $site_url . '/snapshot/';
} else {
	$tag_url  	= 'insipid.cgi?tag=';
	$feed_url 	= $site_url . '/insipid.cgi?op=rss&tag=';
	$full_url 	= $site_url . '/insipid.cgi';
	$snapshot_url	= 'insipid.cgi?op=viewsnapshot&md5=';
}


1;
__END__
