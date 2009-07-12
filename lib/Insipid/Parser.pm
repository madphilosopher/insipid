package Insipid::Parser;

use HTML::Parser;
use HTML::Entities ();
use URI::URL;
use Digest::MD5 qw(md5 md5_hex);
use Insipid::Config;
use Insipid::Database;

use vars qw(@ISA);
@ISA = qw(HTML::Parser);

sub setSnapshotMap {
	my($self, $ssMap) = (@_);
	$self->{SSMAP} = $ssMap;
}

sub new {
	my $pack = shift;
	my $self = $pack->SUPER::new;
	@{$self}{qw(__base __grabit)} = @_;
	$self;
}

sub declaration {
	my $self = shift;
	my ($decl) = @_;
}

sub start {
	my $self = shift;
	my ($tag, $attr, $attrseq, $origtext) = @_;

	if(!defined($self->{__grabit})) {
		print("<$tag");
	}

	for (keys %$attr) {
		my $val = $attr->{$_};
		if(($_ eq "/") && ($val = "/")) { next; }

		if(!defined($self->{__grabit})) { 
			print(" $_=\""); 
		}

		if( "$tag $_" =~ /^(link href|img src)$/i) {
			$val = url($val)->abs($self->{__base},1);

			if(!defined($self->{__grabit})) {
				if($val =~ /(\.gif|\.jpg|\.png|\.css)$/i) {
					my $md5 = md5_hex("$val");
					$val = $snapshot_url . $md5;
				}
			} else {
				# JPG, GIF, PNG and CSS
				if($val =~ /(\.gif|\.jpg|\.png|\.css)$/i) {
					join_urls($self->{__base}, $val);
					$val = $self->{__grabit}($val, $1);
				}
			}
		}

		if(!defined($self->{__grabit})) {
			# Check against our snapshot map
			if(($tag =~ /^a/i) && ($_ =~ /^href/i)) {
				my $sst = $self->{SSMAP};

				if(defined($sst->{$val})) {
					print $snapshot_url . $sst->{$val};
					print('"');
				} else {
					print("$val\"");
				}
			} else {
				print("$val\"");
			}
		}
	}

	if(!defined($self->{__grabit})) { print(">"); }
}

sub end {
	my $self = shift;
	my ($tag) = @_;

	if(!defined($self->{__grabit})) { print("</$tag>"); }
}

sub text {
	my $self = shift;
	my ($text) = @_;

	if(!defined($self->{__grabit})) { print("$text"); }
}

sub comment {
	my $self = shift;
	my ($comment) = @_;

	if(!defined($self->{__grabit})) { print("<!-- $comment -->"); }
}

sub join_urls {
	my($parent, $child) = (@_);
	my $sql = "insert into $tbl_pagecache_references(md5_parent, md5_child) values(?, ?)";
	my $sth = $dbh->prepare($sql);
	$sth->execute(md5_hex($parent), md5_hex($child));
	if($sth->err) {
		# ignore errors for now
	}
}

1;
__END__
