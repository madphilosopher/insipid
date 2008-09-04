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

package Insipid::Sessions;

use warnings;
use strict;

use CGI qw/:standard/;
use CGI::Carp qw(fatalsToBrowser);
use Digest::MD5;

use Insipid::Config;
use Insipid::Database;

use vars qw(@ISA @EXPORT $dbh);
require Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(
logged_in
login
logout
);

# Create/find the session
my $uname = getconfig('username');
my $pagepath = getconfig('pagepath');
my $ctag = "INSIPID2_$uname";
my $sid = cookie($ctag) || undef;
my $logged_in = 0;
my $options;

if(defined($sid)) {
	my $sql = "select create_time from $tbl_authentication 
			where (session_id = ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($sid);

	if($sth->rows ne 0) {
		$logged_in = 1;
	} else {
		print "Set-Cookie: $ctag=; path=$pagepath; expires=Fri, 03-Sep-2020 20:20:13 GMT\n";
	}
}

# Depending on our context we can consider the user logged in.  If they're
# running one of the programs in the "tools" and using a terminal then 
# we'll authorize them.
if(!defined($ENV{'SERVER_NAME'})) {
	$logged_in = 1;
}

sub logged_in {
	return $logged_in;
}

# Creates the session and returns the cookie header for a newly-logged in user.
sub login {
	my $sid = generate_id();

	my $sql = "insert into $tbl_authentication
		(session_id, create_time) values(?, ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute($sid, time());

	$logged_in = 1;
	
	return "Set-Cookie: $ctag=$sid; path=$pagepath; expires=Fri, 03-Sep-2020 20:20:13 GMT\n";
}

# Logs out and returns the cookie header
sub logout {
	if(defined($sid)) {
		my $sql = "delete from $tbl_authentication 
			where (session_id = ?)";
		my $sth = $dbh->prepare($sql);
		$sth->execute($sid);

		$logged_in = 0;
		
		return "Set-Cookie: $ctag=; path=$pagepath; expires=Fri, " . 
			"03-Sep-2020 20:20:13 GMT\n";
	}
}

sub generate_id {
	my @valid = ('A'..'Z','a'..'z','0'..'9');
	my $i;
	my $rv = "";
	
	for($i = 0; $i < 32; $i++) {
		$rv = $rv . $valid[rand @valid];
	}
	
	return $rv;
}



1;
__END__
