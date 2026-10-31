# Abyssal: The Last Ascent

Playable descent. The shared ocean is the game. The frequency is an experiment kept beside it.

The design reference is [ABYSSAL-EVALUATION.md](./ABYSSAL-EVALUATION.md). Do not add regions, creatures, or hulls until two divers can share a sector, leave it, and come back.

## What the ocean does

- Entering the ocean gives you a beacon. The same browser returns as the same diver: air, place, journal, and the seat you no longer hold.
- Each live sector is its own simulation. Empty sectors sleep. A diver in the breach does not receive the creatures fighting in the plains. The chart still shows who is where, and the Maw's health if that fight is occupied.
- You send intent. The sea decides movement, shots, oxygen, boarding, and damage. Two divers cannot book the same seat. On the Kite the helm steers and the tube fires, at the same time.
- Crossing a gate moves you, and anyone in your hull, into the next sector without dropping the dive. The sector you left keeps running only if someone is still there.
- Nine seconds of silence opens your seat and stops that sector if you were alone in it. Ninety seconds shelves the body. Coming back puts you where the sea left you. A dead Maw stays dead.

## What is still the experiment

The frequency under the console is the old browser-to-browser room. The longer host still owns that room. It is not the persistent ocean. Imani and Soren launch only there.

## What is running

- Side-view swim with oxygen, hypoxia, harpoons, hazards, and pickups.
- Scooter (one seat), Kite (helm and tube), Barrow (helm, tube, pumps).
- Pipe eels, ridge hunters, sentries, blooms, and the Lantern Maw.
- Breach, plains, city, works, and reef. Trench, upper ocean, and surface stay sealed.
- The picture stays 512×288. A is left. D is right.

## Honest limit

One ocean process journals the world. It is not a separate machine per sector. Railway runs that process as a Node server against PostgreSQL: the build does not touch the database, the deploy migrates, then `/api/health` has to answer. A missing production database stops the process. It does not open an embedded database.

Local play without `DATABASE_URL` uses an explicit embedded database. That sea is wiped when the process restarts. It is not the deployed ocean, and a cold restart of it starts a fresh sea. Two browsers on one process still share one Maw, one hull, and one gate.
