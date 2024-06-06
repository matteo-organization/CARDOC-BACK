import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
};

interface VehicleUpdateRequest {
  vehicleName: string;
  type?: string;
  brand?: string;
  model?: string;
  mileage?: number;
  color?: string;
  energy?: string;
  date_of_first_registration?: string;
  date_of_purchase?: string;
  number_of_owner?: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  switch (event.httpMethod) {
    case 'POST':
      return postVehicles(event);
    case 'GET':
      return getVehicles();
    case 'PUT':
      return putVehicles(event);
    case 'DELETE':
      return deleteVehicles(event);
    default:
      break;
  }
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'La méthode HTTP doit être GET ou POST.',
      event: event,
    }),
    headers: corsHeaders,
  };
};

const postVehicles = async (event: any) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const {
      vehicleName,
      type,
      brand,
      model,
      mileage,
      color,
      energy,
      date_of_first_registration,
      date_of_purchase,
      number_of_owner,
    } = requestBody;

    const response = await docClient.send(
      new PutCommand({
        TableName: 'vehicles-table',
        Item: {
          vehicleName: vehicleName,
          type: type,
          brand: brand,
          model: model,
          mileage: mileage,
          color: color,
          energy: energy,
          date_of_first_registration: date_of_first_registration,
          date_of_purchase: date_of_purchase,
          number_of_owner: number_of_owner,
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Données insérées avec succès.',
        response,
      }),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion des données dans DynamoDB:",
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'INTERNE' + error }),
      headers: corsHeaders,
    };
  }
};

const getVehicles = async () => {
  try {
    const response = await docClient.send(
      new ScanCommand({
        TableName: 'vehicles-table',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des données dans DynamoDB:',
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'INTERNE' + error }),
      headers: corsHeaders,
    };
  }
};

const putVehicles = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody: VehicleUpdateRequest = JSON.parse(event.body || '{}');
    const { vehicleName, ...updateFields } = requestBody;

    if (!vehicleName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Le champ vehicleName est requis.' }),
        headers: corsHeaders,
      };
    }

    const updateExpressionArray = [];
    const expressionAttributeValues: any = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        updateExpressionArray.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    }

    if (updateExpressionArray.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Aucun champ à mettre à jour.' }),
        headers: corsHeaders,
      };
    }

    const updateExpression = 'SET ' + updateExpressionArray.join(', ');

    const response = await docClient.send(
      new UpdateCommand({
        TableName: 'vehicles-table',
        Key: {
          vehicleName: vehicleName,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Données mises à jour avec succès.',
        response,
      }),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error(
      'Erreur lors de la mise à jour des données dans DynamoDB:',
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'INTERNE' + error }),
      headers: corsHeaders,
    };
  }
};

const deleteVehicles = async (event: any) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { vehicleName } = requestBody;

    const response = await docClient.send(
      new DeleteCommand({
        TableName: 'vehicles-table',
        Key: {
          vehicleName: vehicleName,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Données supprimées avec succès.',
        response,
      }),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error(
      'Erreur lors de la suppression des données dans DynamoDB:',
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'INTERNE' + error }),
      headers: corsHeaders,
    };
  }
};
