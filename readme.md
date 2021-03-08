# Discord Server Manager

## Setup
### Requirements
- NodeJS
- Role titled "organizer"
- Permissions:
    - Manage channels
    - Manage roles
	- Read messages
	- Must be ranked higher than any attendees who are being assigned a breakout

### Instructions
1. Clone the repository.
2. Run `npm install`
3. Run `node bot.js`
4. Modify the config.ini file to include your bot's secret.
5. Run `node bot.js` once more.

## Use
### Commands
- $help: Shows these commands
- $assign: Assigns roles to all students for breakout rooms.
- $create: Creates categories, channels, and roles for breakouts.
- $clean: Removes categories, channels, and roles for breakouts.
- $kick (Not yet implemented): Kick all users who are not organizers, administrators, or otherwise.