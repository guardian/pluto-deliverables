#!/usr/bin/perl

use Getopt::Long;
use DBI;

#CONFIGURABLE SETTINGS
our $dbhost="dc1-mmdb-00.dc1.gnm.int";
our $dbname="octopusid";
our $dbuser="readoctid";
our $dbpass="readoctid";
#END CONFIGURABLE

my $commission_id=-1,$project_id=-1,$master_id=-1,$prepend="",$append="",$fail=0;

sub usage()
{
print "Allocates an Octopus ID from the database '".$dbname."' on '".$dbhost."' to a given object and returns it\n";
print "This script is used by the PLUTO project-lifecycle system to obtain GNM compatible object IDs\n\n";
print "Usage: ./new_title_id.pl --commission-id=KP-nnn --project-id=KP-nnn --master-id=KP-nnn [--prepend=string] [--append=string]\n";
print "where KP-nnn are Vidispine item IDs.  The --prepend and --append strings are passed to the database where they are recorded.\n";
}

#process arguments
my $options = GetOptions("commission-id=s"=>\$commission_id,
			"project-id=s"=>\$project_id,
			"master-id=s"=>\$master_id,
			"prepend=s"=>\$prepend,
			"append=s"=>\$append,
            "fail"=>\$fail);


if($master_id==-1){
	usage();
	print "-ERROR: You need to specify a Vidispine master id with the --master-id argument";
	exit 3;
}

if($prepend){
	$prepend=~s/[\|;]//;	#we use the | character as a delimiter so remove it
}
if($append){
	$append=~s/[\|;]//;
}

#This is the string that will be given to the database to describe the object that this ID has been assigned to
my $descriptor=$prepend."| ".$commission_id.";".$project_id.";".$master_id." |".$append;

#connect to the database
my $dbh=DBI->connect("DBI:Pg:dbname=$dbname;host=$dbhost",$dbuser,$dbpass);
unless($dbh){
	print "-ERROR: Unable to connect to database: ".$dbh->error;
	exit 2;
}

$dbh->do("BEGIN");
#obtaining this lock should prevent any other instance reading or writing to the database, and should delay us until it is free
#The lock is automatically released at COMMIT
$dbh->do("LOCK TABLE ids IN ACCESS EXCLUSIVE MODE");
#my $sth=$dbh->prepare("UPDATE ids SET allocated_to=?, allocated_at=now() where id=(SELECT id FROM ids WHERE allocated_to is null order by id asc limit 1) returning id");
my $sth=$dbh->prepare("UPDATE ids SET allocated_to=?, allocated_at=now()
where id=(
        SELECT id FROM ids WHERE
                allocated_to is null
                or allocated_to=?
                order by id asc limit 1)
returning id");
my $result=$sth->execute($descriptor,$descriptor);
$dbh->do("COMMIT");

my $result=$sth->fetchrow_arrayref;
print $result->[0]."\n";

#generate a random id
#my $n=-1;

#while($n<$min_id_number){
#	$n=int(rand($max_id_number));
#}

#my $final_id=$prepend.$commission_id.$project_id.$master_id.$n.$append;

#print "$final_id";

# Exit with non-zero code if requested, used in tests.
if ($fail) {
    exit 1;
}
exit 0;
