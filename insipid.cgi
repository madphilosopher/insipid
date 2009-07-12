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

use Data::Dumper;
use warnings;
use strict;

# This stub checks for libraries and what not and then calls the main program.

if(!-e "insipid-config.cgi") {
	# TODO: Better error message here.
	show_error("Configuration file missing", "The \"insipid-config.cgi\"" .
		" file could not be found.");
}


eval {
	push(@INC, "lib");
	require Insipid::Main;
	Insipid::Main::main();
};

if($@) {
	my $errstr = $@;	
	if($errstr =~ /Can\'t locate (.*) in/) {
		show_error("Couldn't find the module \"$1\".", "You may want to " .
			"<a href=\"http://search.cpan.org/\">search CPAN</a> " .
			"for the module or check the " .
			"<a href=\"https://neuro-tech.net/insipid/\">" .
			"Insipid</a> homepage for more information.",
			$errstr);
	} elsif (
		($errstr =~ /Couldn\'t acquire lock on id/) ||
		($errstr =~ /doesn\'t exist/) ||
		($errstr =~ /relation \".*\" does not exist/) ) {

		print STDERR "Creating database\n";

		#print STDERR Dumper(\%INC);
		#delete $INC{'Insipid/Database.pm'};

		# This means that a database connection was established but the
		# tables were not found.
		undef($@);
		eval {
			push(@INC, "lib");
			require Insipid::DBCreate;
			Insipid::DBInstall::install();
		};

		if($@) {
			$errstr = $@;
			show_error("Database error", "There was a problem " . 
			"creating the database tables required by Insipid:",
			$errstr);
		}
	} else {
		print "Content-Type: text/plain\r\n\r\nError: $@\r\n";
	}
}

sub show_error {
	my ($subject, $body, $error) = (@_);
	print "Content-Type: text/html\r\n\r\n";
	print "<html><head><title>Insipid Error</title></head>";
	print "<body>";
	print "<h2>$subject</h2>";
	print "<p><font size=\"+1\"></font></p>";
	print "<p><font size=\"+1\">$body";
	print "</font></p>";

	if(defined($error)) {
		print '<pre>' . $error . '</pre>';
	}

	print '</body></html>';
	exit;
}
