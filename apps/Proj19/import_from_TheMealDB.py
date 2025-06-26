import requests
import json

def import_recipes():
  url = "https://www.themealdb.com/api/json/v1/1/lookup.php?i="
  output_meals = {'meals': []}
  for i in range(52764, 53087):
      response = requests.get(url + str(i))
      if response.status_code == 200:
          data = response.json()
          meals = data['meals']
          if meals:
              for meal in meals:
                  output_meals['meals'].append(meal)
          else:
              print("No Meals for i =", i)
      else:
          print("Response code:", response.status_code)

  with open("meals.json", "w") as outfile:
    json.dump(output_meals, outfile)


import_recipes()
