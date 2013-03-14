How to enable this application as a system daemonm for RHEL/CentOS/Fedora:

1) install forever globally: 

   npm install -g forever

2) copy node-yammerwall to /etc/init.d

3) ensure the app starts when the server boots: 

   /sbin/chkconfig --add node-yammerwall

4) start the service: 

   service node-yammerwall start
