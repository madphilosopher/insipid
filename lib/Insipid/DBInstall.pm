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

package Insipid::DBInstall;

use strict;
use warnings;

use Insipid::Config;
use Insipid::Schemas;

use DBI qw/:sql_types/;;
use vars qw($version);

use Exporter ();
our (@ISA, @EXPORT);
	
@ISA = qw(Exporter);
@EXPORT = qw(install);

sub install {
	my ($sth, $dbname, $dbuser, $dbpass, $dbtype, $dsn, $dbh, @creates);

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

1;
__END__
