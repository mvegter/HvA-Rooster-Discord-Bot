/*
This file (index.js) is part of HvA-Rooster-Discord-Bot.
Copyright (C) 2017  Martijn Vegter

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var log = console.log;
console.log = function() {
	var first_parameter = arguments[0];
	var other_parameters = Array.prototype.slice.call(arguments, 1);

	function formatConsoleDate(date) {
		var hour = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		var milliseconds = date.getMilliseconds();

		return '[' +
			((hour < 10) ? '0' + hour : hour) +
			':' +
			((minutes < 10) ? '0' + minutes : minutes) +
			':' +
			((seconds < 10) ? '0' + seconds : seconds) +
			'] ';
	}

	log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};

const Discord = require('discord.js');
const ical = require('ical');
const dateFormat = require('dateformat');
const client = new Discord.Client();

const ICalLink = "http://rooster.hva.nl/ical?59b29cf8&group=false&deduplicate=true&eu=dmVndGVybQ==&h=4T4PjWb2PaBj8giw29sfeXptd3zWjqk55KhUQw6Yb6U=";
const ScheduleInterval = 5; // Minutes
const NotifyInterval = 1; // Minutes

var roosterData = null;
var notificationChannel = null;
var lastFetch = null;

function CheckSchedule() {
	if (roosterData == null || (Date.now() / 1000) - lastFetch > (ScheduleInterval * 60)) {
		console.log("Updating Schedule");

		ical.fromURL(ICalLink, {}, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				console.log("Updated Schedule");
				roosterData = data;
				lastFetch = (Date.now() / 1000);
			}
		});
	}
}

client.on('ready', () => {
	var server = client.guilds.find("name", "TI102");
	if (server === null) {
		throw "Couldn't find server 'TI102'";
	}
	console.log('I am ready!');
	CheckSchedule()

	setInterval(function() {
		CheckSchedule();

		if (notificationChannel != null) {
			console.log("Checking Schedule");

			var vandaag = dateFormat(new Date(), "shortDate");
			for (var moment in roosterData) {
				if (roosterData.hasOwnProperty(moment)) {
					var ev = roosterData[moment];

					if (dateFormat(ev.start, "shortDate") != vandaag) {
						continue;
					}

					var currentIsoTime = dateFormat(Date(), "isoTime");
					currentIsoTime = currentIsoTime.split(":");
					var currentUnixTime = parseInt((parseInt(currentIsoTime[0] * 60 * 60)) + parseInt(((currentIsoTime[1]) * 60)) + parseInt(currentIsoTime[2]));

					var lesIsoTime = dateFormat(ev.start, "isoTime");
					lesIsoTime = lesIsoTime.split(":");
					var lesUnixTime = parseInt((parseInt(lesIsoTime[0] * 60 * 60)) + parseInt((lesIsoTime[1] * 60)) + parseInt(lesIsoTime[2]));

          var timeDiff = parseInt(lesUnixTime - currentUnixTime);
					if (timeDiff <= parseInt((5 * 60)) && timeDiff > 0 && !ev.hasBeenNotified) {
						ev.hasBeenNotified = true;

						var startTijd = dateFormat(ev.start, "isoTime");
						var eindTijd = dateFormat(ev.end, "isoTime");

						if (ev.summary == undefined || startTijd == eindTijd) {
							continue;
						}

						if (ev.location == "" || ev.location == null) {
							ev.location = "Onbekende Locatie";
						}

						notificationChannel.send("``` Volgende les : " + startTijd + " - " + eindTijd + " || " + ev.location + " || " + ev.summary + "```");
					}
				}
			}
		} else {
			console.log("No Main Channel Set!");
		}

	}, NotifyInterval * 60 * 1000)
});

function TodayOrNext(num) {
	var d = new Date();
	d.setDate(d.getDate() + ((num + 7 - d.getDay()) % 7) % 7);
	return d;
}

function DayToDate(userMessage)
{
  var dag = userMessage.replace("wat hebben we ", "");
      dag = dag.replace("welke lessen hebben we ", "");
      dag = dag.replace('!rooster ', '')
      dag = dag.replace("?", "")
      dag = dag.replace(' ', '');

  switch (dag) {
    case "maandag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(1), "d-m-yy");
      break;
    case "dinsdag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(2), "d-m-yy");
      break;
    case "woensdag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(3), "d-m-yy");
      break;
    case "donderdag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(4), "d-m-yy");
      break;
    case "vrijdag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(5), "d-m-yy");
      break;
    case "zaterdag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(6), "d-m-yy");
      break;
    case "zondag":
      userMessage = "!rooster " + dateFormat(TodayOrNext(0), "d-m-yy");
      break;
    default:
      userMessage = "!rooster";
      break;
  }

  return userMessage;
}

client.on('message', messageObject => {
	var userMessage = messageObject.content.toLowerCase();
	var userChannel = messageObject.channel;
  var userObject = messageObject.author;

	if (!userMessage.startsWith('!rooster') && !userMessage.startsWith("wat hebben we") && !userMessage.startsWith("welke lessen hebben we")) {
		return;
	}

  console.log(userObject.username + ' (' + userObject.id + '): ' + messageObject.content);

	if (userMessage == '!rooster help') {
		return userChannel.send(
			"``` !rooster ```" +
			"``` !rooster morgen ```" +
			"``` !rooster (dag-maand-jaar) ```");
	}

	if (userMessage == '!rooster setchannel') {
		if(messageObject.member.roles.find("name", "Admin") == null)
		{
			return messageObject.reply("You are not authorized to perform this action!");
		}

		notificationChannel = userChannel;
		console.log("Set Notification Channel to: " + userChannel.name);
		return userChannel.send('``` Rooster Notificatie Kanaal: "' + userChannel.name + '" ```');
	}

	if (userMessage.startsWith("wat hebben we") || userMessage.startsWith("welke lessen hebben we")) {
    userMessage = DayToDate(userMessage);
	}

	var response = "";
	var vandaag = dateFormat(new Date(), "shortDate");
	var morgen = dateFormat(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), "shortDate");

	for (var moment in roosterData) {
		if (roosterData.hasOwnProperty(moment)) {
			var ev = roosterData[moment];

			if (userMessage == "!rooster" || userMessage.indexOf("vandaag") > -1) {
				if (dateFormat(ev.start, "shortDate") != vandaag) {
					continue;
				}
			} else if (userMessage.indexOf("morgen") > -1) {
				if (dateFormat(ev.start, "shortDate") != morgen) {
					continue;
				}
			} else if (userMessage.split(" ").length == 2) {
        var identifier = userMessage.split(" ")[1];
        if(!identifier.match("([1-9]|[012][1-9])-([1-9]|[012][012]|0[1-9])-(1[78]|201[78])") && !identifier.match("maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag"))
        {
          return userChannel.send('Invalid Date given');
        }

        if(identifier.match("maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag"))
        {
          console.log("match");
          userMessage = DayToDate(userMessage);
          console.log(userMessage);
        }

				var userDate = userMessage.substring(userMessage.indexOf(" ") + 1);

				var day = userDate.split("-")[0];
				var month = userDate.split("-")[1];
				var year = userDate.split("-")[2];

				var userDate = "" + month + "-" + day + "-" + year + "";

				if (dateFormat(ev.start, "shortDate") != dateFormat(userDate, "shortDate")) {
					continue;
				}
			} else {
				continue;
			}

			var startTijd = dateFormat(ev.start, "HH:MM");
			var eindTijd = dateFormat(ev.end, "HH:MM");

			if (ev.summary == undefined || startTijd == eindTijd) {
				continue;
			}

			if (ev.location == "" || ev.location == null) {
				ev.location = "Onbekende Locatie";
			}

			response += "```" + startTijd + " - " + eindTijd + " | " + ev.location + " | " + ev.summary + "```";
		}
	}
	if (response == "") {
		response = "``` Helemaal niks op het rooster :) ```"
	}
	userChannel.send(response);
});

client.login('BOT TOKEN');
