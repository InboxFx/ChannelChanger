const Discord = require('discord.js');const client = new Discord.Client();
const jsonfile = require('jsonfile');
client.on('ready', () => {
	console.log('Ready!');
	client.user.setPresence({ game: { name: "!help - Changing Channels", type: 0 } });
	for(var i=0;i<client.guilds.array().length;i++){
		console.log(client.guilds.array()[i].name+" id: "+client.guilds.array()[i].id)
    }
    scanAll()
});
const tokens = require('./tokens.js');
client.login(tokens.bot_token);
var channels=require("./channels.json")
var noFlyList=["nogame","Spotify"]

var keys=[] //list of channel id's

function autosave() {
	console.log("Auto-saving Database..")
	jsonfile.writeFile("./channels.json", channels, function (err) {
		if (err){
			console.log(err)
		}
	})
	keys=Object.keys(channels)
	console.log("Autosave Complete")
}
keys=Object.keys(channels)
function majority(array,userCount){
    var items=new Object()
    for (var i = 0; i < array.length; i++){
        items[array[i]]=((items[array[i]] || 0)+1)
    }
    var majority=""
    var majorityNumber=0
    for(var key in items){
        if(items[key]>majorityNumber){
            majority=key;
            majorityNumber=items[key]
        }
    }
    if((majorityNumber/userCount)>0.5){
        return(majority)
    }else{
        return("nogame")
    }
}

function scanAll(){
    for(var i=0;i<keys.length;i++){
        scanOne(keys[i])
    }
}

client.setInterval(scanAll,20000)

function scanOne(channelId){
    var channel=client.channels.get(channelId);
    if(channel){
        if(channel.manageable){
            if(channel.members.firstKey()){
                var games = [];
                for(var i = 0; i < channel.members.array().length; i++){
                    if(!channel.members.array()[i].user.bot){
                        if(channel.members.array()[i].presence.game){
                            games.push(channel.members.array()[i].presence.game.name || "nogame");
                        }
                    }
                }
                var newTitle=majority(games,channel.members.array().length)
                if(!noFlyList.includes(newTitle)){
                    channel.setName(channels[channelId]+" - "+newTitle)
                }else{
                    channel.setName(channels[channelId])
                }
            }else{
                channel.setName(channels[channelId])
            }
        }
    }else{
        //console.log("Found deleted channel "+channels[channelId])
        //delete channels[channelId]
    }
}

client.on('voiceStateUpdate', (oldMember,newMember) => {
    if(oldMember.voiceChannel!==newMember.voiceChannel){
        if (oldMember.voiceChannel){
            if (channels[oldMember.voiceChannel.id]){
                scanOne(oldMember.voiceChannel.id)
            }
        }
        if (newMember.voiceChannel){
            if (channels[newMember.voiceChannel.id]){
                scanOne(newMember.voiceChannel.id)
            }
        }
    }
})

client.on('message', message =>{
	var messageL=message.content.toLowerCase()
	if (message.guild){
		if (messageL==="!addvc"){
            if(message.guild.me.hasPermission("MANAGE_CHANNELS")){
                if(message.member.hasPermission("MANAGE_CHANNELS")){
                    if (message.member.voiceChannel){
                        try{
                            if (!channels[message.member.voiceChannel.id]){
                                channels[message.member.voiceChannel.id]=message.member.voiceChannel.name;
                                autosave()
                                message.channel.send("Successfully added `"+message.member.voiceChannel.name+"` to my list")
                            }else{
                                message.channel.send("`"+channels[message.member.voiceChannel.id]+"` is already on my list.")
                            }
                        }catch(err){
                            console.log(err)
                        }
                    }else{
                        message.channel.send("You must be in a voice channel to use this command.")
                    }
                }else{
                    message.channel.send("You need `manage_channels` permission to do this.")
                }
            }else{
                message.channel.send("I need `manage_channels` permission to do this.")
            }
        }
		else if (messageL==="!removevc"){
            if(message.guild.me.hasPermission("MANAGE_CHANNELS")){
                if(message.member.hasPermission("MANAGE_CHANNELS")){
                    if (message.member.voiceChannel){
                        try{
                            if (channels[message.member.voiceChannel.id]){
                                message.member.voiceChannel.setName(channels[message.member.voiceChannel.id])
                                delete channels[message.member.voiceChannel.id];
                                autosave()
                                message.channel.send("Successfully removed `"+message.member.voiceChannel.name+"` from my list.")
                            }else{
                                message.channel.send("`"+message.member.voiceChannel.name+"` was not on my list.")
                            }
                        }catch(err){
                            console.log(err)
                        }
                    }else{
                        message.channel.send("You must be in a voice channel to use this command!")
                    }
                }else{
                    message.channel.send("You need `manage_channels` permission to do this.")
                }
            }else{
                message.channel.send("I need `manage_channels` permission to do this.")
            }
        }
		else if (messageL==="!help"){
			message.channel.send("__Channel Changer Help__\n*The purpose of Channel Changer is to add what game you're playing to your connected voice channel's name.*\n**!addvc**: Adds your voice channel to be renamed.\n**!removevc**: Removes your voice channel from the list.")
		}
	}
})

client.on("guildCreate", guild=>{
	console.log(guild.name)
})
