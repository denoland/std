# Clients

## Channels
* [x] Named group of one or more clients
* [x] All clients in channel receive messages addressed to the channel
  * `PRIVMSG #channel :Message here`
* [ ] Channel name validation
  * [ ] Cannot contain characters `0x20` (SPACE), `0x07` (BELL), or `0x2C` (comma)
* [x] User `JOIN`ing channel
  * [x] If channel does not exist, the channel is created and the user becomes channel operator
  * [x] If channel exists, user joins and is made operator only if certain modes are set
* [ ] Operator can set topic

## Channel Types
* [x] Regular Channels (`#`)
* [ ] Local channels (`&`)

## Channel Modes
* [ ] Ban channel mode (`+b`)
  * [x] List of client IDs that are not allowed to join or speak in this channel
  * [x] If a user tries to join a channel they are banned from, they get `ERR_BANNEDFROMCHAN` error
  * [ ] Operator is able to edit this array
* [ ] Exception Channel mode (`+e`)
  * [ ] Nonstandard, will implement later
  * [ ] List of client IDs that are exempt from bans
* [ ] Client Limit Channel mode (`+l`)
  * [ ] An integer defining how many total users may be connected to the channel
  * [ ] If a user attempts to join and there are users in the channel equal to the integer, a `JOIN` will fail with error `ERR_CHANNELISFULL`
* [ ] Invite-only Channel mode (`+i`)
  * [ ] To join this channel, a user must receive an `INVITE` from someone within the channel
  * [ ] If a user attempts to join without an invite, join fails with error `ERR_INVITEONLYCHAN`
* [ ] Invite-Exception Channel mode (`+I`)
  * [ ] Nonstandard
  * [ ] List of users exempt from invite-only channel mode
  * [ ] If a user attempts to join without an invite but are on this list, join succeeds
* [ ] Key Channel mode (`+k`)
  * [ ] Saves a key which must be supplied to join this channel
  * [ ] If a user attempts to join and does not supply the correct key, the join fails with error `ERR_BADCHANNELKEY`
* [ ] Moderated Channel mode (`+m`)
  * [ ] Boolean as to whether users are restricted from sending messages to this channel without privileges
  * [ ] If a user attempts to send a message while this flag is on, it succeeds only if the user has channel privileges
* [ ] Secret Channel mode (`+s`)
  * [ ] A secret channel will not show up in responses to `LIST` or `NAMES` unless the user is joined to the channel
  * [ ] Secret channels will also not show up in `RPL_WHOISCHANNELS` unless user is joined to the channel
* [ ] Protected Topic mode (`+t`)
  * [ ] If enabled, user must be halfop or operator to change the topic of the channel
  * [ ] By default, any user can change the `TOPIC` to whatever
* [ ] No External Messages Mode (`+n`)
  * [ ] If enabled, a user sending messages to this channel will fail unless they are joined to the server with error `ERR_CANNOTSENDTOCHAN`

## Channel Membership Prefixes
* [ ] Founder Prefix (`~`, `+q`)
  * [ ] Nonstandard, but given to the person who founded a channel
* [ ] Operator Prefix (`@`, `+o`)
  * [ ] Operators can perform tasks like kicking users, applying channel modes, setting privileges of other users, etc.
* There exists others, but they are all nonstandard

# Messages