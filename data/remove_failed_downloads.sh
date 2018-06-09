file {,not_}chickens/* | grep 'HTML document' | cut -d ':' -f1 | xargs rm
