# TODO: Move into py4web application and convert into DAL table entries.

url = "https://www.themealdb.com/api/json/v1/1/lookup.php?i="
c = 0
for i in range(52764, 53087):
    response = requests.get(url + str(i))
    if response.status_code == 200:
        data = response.json()
        meals = data['meals']
        if meals:
            for meal in meals:
                # TODO: Add meal to the database
                c += 1
        else:
            print("No Meals for i =", i)
    else:
        print("Response code:", response.status_code)
