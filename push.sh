#!/bin/bash
echo "👉 Message du commit : "
read message
git add .
git commit -m "$message"
git push origin main