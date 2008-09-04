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

package Insipid::Util;

use strict;
use warnings;

use vars qw(@ISA @EXPORT @EXPORT_OK);

use Insipid::Sessions;
use Insipid::Config;

require Exporter;

@ISA = qw(Exporter);

@EXPORT = qw(
ims_time
sanitize_html
check_access
);

@EXPORT_OK = qw();

my @DoW = qw(Sun Mon Tue Wed Thu Fri Sat);
my @MoY = qw(Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec);

# TODO: If content is already sent, add the error to @errors instead of dying
sub check_access {
	if(logged_in() ne 1) {
		print "Content-Type: text/plain\r\n\r\n";
		print "You have to be logged in to perform that operation.";
		exit;
	}
}

sub sanitize_html {
	my ($orig) = (@_);

	$orig =~ s/</&lt;/gi;
	$orig =~ s/>/&gt;/gi;

	$orig =~ s/&amp;/&/gi;
	$orig =~ s/&/&amp;/gi;

	return $orig;
}


# From http::date
sub ims_time {
    my ($time) = (@_);
    my ($sec, $min, $hour, $mday, $mon, $year, $wday) = gmtime($time);
    return sprintf("%s, %02d %s %04d %02d:%02d:%02d GMT",
            $DoW[$wday],
            $mday, $MoY[$mon], $year+1900,
            $hour, $min, $sec);
}

1;
__END__
