import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    const { vehicleName, description, createdAt, createdBy, dev, prod } = requestBody;

    const response = await docClient.send(
      new PutCommand({
        TableName: 'Vehicles',
        Item: {
          vehicleName: vehicleName,
          // description: description,
          // lastUsage: new Date('1970-01-01T00:00:00.000Z').getTime(),
          // createdAt: createdAt,
          // createdBy: createdBy,
          // dev: dev,
          // prod: prod,
        },
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Données insérées avec succès.', response }),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error("Erreur lors de l'insertion des données dans DynamoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur interne du serveur.' }),
      headers: corsHeaders,
    };
  }
};

const getVehicles = async () => {
  try {
    const response = await docClient.send(
      new ScanCommand({
        TableName: 'Vehicles',
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données dans DynamoDB:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur interne du serveur.' }),
      headers: corsHeaders,
    };
  }
};

const putVehicles = async (event: any) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { vehicleName, description, createdAt, createdBy, dev, prod } = requestBody;

    const updateExpression =
      'SET description = :description, createdAt = :createdAt, createdBy = :createdBy, dev = :dev, prod = :prod';

    const response = await docClient.send(
      new UpdateCommand({
        TableName: 'Vehicles',
        Key: {
          vehicleName: vehicleName,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ':description': description,
          ':createdAt': createdAt,
          ':createdBy': createdBy,
          ':dev': dev,
          ':prod': prod,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Données mises à jour avec succès.', response }),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données dans DynamoDB:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur interne du serveur.' }),
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
        TableName: 'Vehicles',
        Key: {
          vehicleName: vehicleName,
        },
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Données supprimées avec succès.', response }),
      headers: corsHeaders,
    };
  } catch (error) {
    console.error('Erreur lors de la suppression des données dans DynamoDB:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur interne du serveur.' }),
      headers: corsHeaders,
    };
  }
};
