# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
    config.vm.network :forwarded_port, guest: 35729, host: 35729
    config.vm.network :forwarded_port, guest: 8080, host: 8080
    config.vm.box = "hashicorp/precise64"
    config.vm.synced_folder "salt/roots/", "/srv/"
    config.vm.provision :salt do |salt|
        salt.minion_config = "salt/minion"
        salt.run_highstate = true
        salt.verbose = true
    end
end
