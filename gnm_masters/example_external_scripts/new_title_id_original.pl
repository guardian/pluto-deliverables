#!/usr/bin/perl

use Getopt::Long;

our $max_id_number=999999999;
our $min_id_number=10000;

my $commission_id=-1,$project_id=-1,$master_id=-1,$prepend="",$append="",$fail=0;

#process arguments
my $options = GetOptions("commission-id=s"=>\$commission_id,
			"project-id=s"=>\$project_id,
			"master-id=s"=>\$master_id,
			"prepend=s"=>\$prepend,
			"append=s"=>\$append,
            "fail"=>\$fail);

#generate a random id
my $n=-1;

while($n<$min_id_number){
	$n=int(rand($max_id_number));
}

my $final_id=$prepend.$commission_id.$project_id.$master_id.$n.$append;

print "$final_id";

# Exit with non-zero code if requested, used in tests.
if ($fail) {
    exit 1;
}
exit 0;
